import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { CONTENT_CATEGORIES, generateSlug, type ContentCategory } from "@/lib/content";
import { COUNTRIES, isCountryCode, type CountryCode } from "@/lib/countries";
import { logServerEvent } from "@/lib/serverLogger";

/**
 * Daily content research, run inside the app.
 *
 * This used to be a scheduled cloud agent that POSTed into our API, but that
 * environment's egress policy blocks this host outright, so the job failed at
 * its first request every time. Running the research here removes the network
 * dependency entirely: the app already talks to both Anthropic and its own
 * database.
 *
 * The loop is time-budgeted and commits after each category rather than at the
 * end. A serverless timeout mid-run therefore still leaves real, saved work
 * instead of losing the whole run.
 */

const MODEL = "claude-sonnet-5";

/** Stop starting new categories once this much of the budget is gone. */
const DEFAULT_BUDGET_MS = 240_000;
/** A single category rarely needs more than a few searches. */
const MAX_SEARCHES_PER_CATEGORY = 6;
const MAX_ITEMS_PER_CATEGORY = 2;

const CATEGORY_BRIEF: Record<ContentCategory, string> = {
  work:
    "Work passes, levies, rest days, contracts, workplace safety, ICA/CPF for pass holders; official job fairs and MyCareersFuture openings only (see jobs rule); skills training and free courses; consular notices from Myanmar, Indian, Chinese, Bangladeshi and Malaysian missions — name which country in the title when consular.",
  money:
    "Remittance channels and fees, bank/wallet changes, the 25% official-channel remittance rule; GST and GST Vouchers, CDC vouchers, U-Save rebates, transport concessions — ALWAYS state who qualifies (many schemes are citizens/PRs only).",
  safety:
    "Scams, loan sharks, deceptive employment agents, fake job offers, police/MOM advisories; TADM salary claims, work injury compensation, contract disputes, free legal aid.",
  health:
    "Clinics, medical insurance, MOM medical requirements, mental health support, haze health advisories.",
  housing:
    "Renting a room or flat: tenancy rights and deposits, HDB/URA subletting rules, agent fees, dormitory standards, utility bills and disputes. Newcomers are most often overcharged here.",
  community:
    "Community events and gatherings for Myanmar, Indian, Chinese, Bangladeshi and Malaysian communities; festivals, migrant-worker centres, relief drives; planned MRT/bus disruptions naming line, stations and dates (never live minute-by-minute delays).",
};

const SYSTEM_PROMPT = `You research daily updates for Hello SG MM, an information portal published in English and Myanmar.

WHO IT IS FOR: anyone who has to understand Singapore in a second language. That is the 1.6 million people here on a work pass — Work Permit, S Pass, Employment Pass — plus their families, foreign students, new PRs, and residents who read Chinese, Tamil, Malay or Bengali more comfortably than English. Readers come mainly from Myanmar, India, China, Bangladesh and Malaysia.

WHAT WE ARE NOT: we do not compete with CNA or the Straits Times, and we are not a general Singapore news site. We compete with a person not finding out at all because the information only existed in English. Ask of every item: would someone miss this, or misunderstand it, because of language? If a story is already everywhere in plain English and carries no consequence for our readers, skip it.

BALANCE: readers are of five nationalities and the portal must not read as a service for one of them. Most Singapore rules — MOM, transport, health, scams — apply to everyone: write them for everyone, and never frame a general Singapore rule as a Myanmar matter. An item tied to one nationality (a consular notice, a home-country remittance requirement, a national holiday) must name that country in the title so a reader it does not concern can skip it, and must set the "country" output field.

NON-NEGOTIABLE RULES
1. Never fabricate. Every policy, fee, date, rate, address or phone number must come from a page you actually retrieved via web search. No "typically" or "usually around".
2. Every item needs a real, working source URL you actually opened.
3. Publish nothing rather than something weak. Returning zero items is a correct, expected outcome on a quiet day.
4. No medical, legal or immigration advice in your own voice. Report what the source says and point to the official body (MOM, TADM, MWC, HOME, TWC2).
5. No personal data: never include an individual worker's name, photo, FIN, passport number or employer, even from a public news story.
6. Only material dated within roughly the last 7 days, unless it is an ongoing advisory still in force.

SOURCES
Tier 1 (acceptable alone): mom.gov.sg, tal.sg/TADM, police.gov.sg, scamalert.sg, cpf.gov.sg, ica.gov.sg, moh.gov.sg, nea.gov.sg, lta.gov.sg, smrt.com.sg, sbstransit.com.sg, mycareersfuture.gov.sg, wsg.gov.sg, gov.sg, mwc.org.sg, and the missions' own sites: myanmarembassy.sg, hcisingapore.gov.in, sg.china-embassy.gov.cn, singapore.mofa.gov.bd, kln.gov.my
Tier 2 (acceptable): Straits Times, CNA, TODAY, Mothership, TWC2, HOME
Tier 3 (Facebook, Telegram, TikTok, forums, blogs): NEVER acceptable alone. Needs a Tier 1/2 source confirming it.
Never use content farms, scraped aggregators or AI-generated news sites.

THE JOBS RULE — STRICTEST HERE
Fake job offers are the most damaging scam aimed at this audience; a worker can lose an agency fee, a passport, or their legal status.
ONLY post: openings on official government portals (MyCareersFuture, Workforce Singapore); job fairs run by government agencies, MOM-licensed agencies, embassies or established NGOs; government hiring schemes.
NEVER post: an individual advert from social media or a group chat; anything asking for a fee, deposit or "processing charge"; anything from an agency you cannot verify as MOM-licensed; anything with a personal phone number as contact; anything promising unusually high pay or guaranteed placement.
When in doubt, return nothing for this category.

TRANSPORT: report PLANNED/confirmed disruptions naming line, stations and dates. Never live minute-by-minute delays — they are stale before a human approves them.

WRITING
Both languages, always. Myanmar must be standard Unicode (never Zawgyi), natural rather than word-for-word, everyday vocabulary. Keep terms workers already use in English: Work Permit, S Pass, FIN, MOM, TADM, PayNow, Singpass, MRT, levy. Re-read every Myanmar sentence for spelling before returning it. Note: "ရက်ပေါက်" is NOT a word for a day off — use "ပိတ်ရက်" or "နားရက်".
Title: max ~120 characters, states the actual news, no clickbait.
Summary: one sentence on what it means for the reader.
Body: 2-5 short sentences — practical consequence first, then detail, then where to get help.
Tone: calm and factual. Do not use fear to drive engagement, even for scam alerts.

OUTPUT
Return ONLY a single fenced json code block, nothing before or after it:
\`\`\`json
{"items":[{"titleEn":"","titleMy":"","summaryEn":"","summaryMy":"","bodyEn":"","bodyMy":"","sourceUrl":"","sourceName":"","sourcePublishedAt":"YYYY-MM-DD","priority":"normal","country":null}]}
\`\`\`
priority is "urgent" only for an immediate safety risk or hard deadline, otherwise "normal".
country is "mm", "in", "cn", "bd" or "my" ONLY when the item is specific to that one nationality; otherwise null. Null is the normal case — a Singapore rule that binds every worker is not a Myanmar item because a Myanmar worker is affected by it.
If nothing meets the bar, return {"items":[]}.`;

export type ResearchItem = {
  titleEn: string;
  titleMy: string;
  summaryEn?: string;
  summaryMy?: string;
  bodyEn: string;
  bodyMy: string;
  sourceUrl: string;
  sourceName?: string;
  sourcePublishedAt?: string;
  priority?: "urgent" | "high" | "normal";
  /** Set only when the item is specific to one nationality. */
  country?: string;
  // type = "event"
  startsAt?: string;
  endsAt?: string;
  locationName?: string;
  address?: string;
  // type = "directory"
  phone?: string;
  website?: string;
  openingHours?: string;
  isFree?: boolean;
};

export type ResearchSummary = {
  categoriesAttempted: ContentCategory[];
  inserted: number;
  duplicates: number;
  rejected: { reason: string; title: string }[];
  errors: string[];
  timedOut: boolean;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Pull the JSON object out of the model's fenced block. */
function parseItems(text: string): ResearchItem[] {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  try {
    const parsed = JSON.parse(raw.trim()) as { items?: unknown };
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items as ResearchItem[];
  } catch {
    return [];
  }
}

/**
 * Reject anything malformed before it can reach the review queue. The model is
 * instructed not to produce these, but the queue is the last place a bad item
 * should be discovered, so we check rather than trust.
 */
function validate(item: ResearchItem, mode: ResearchMode = "news"): string | null {
  if (!item?.titleEn?.trim() || !item?.titleMy?.trim()) return "missing title";
  if (!item?.bodyEn?.trim() || !item?.bodyMy?.trim()) return "missing body";
  if (!item?.sourceUrl?.trim()) return "missing source URL";
  try {
    const url = new URL(item.sourceUrl);
    if (url.protocol !== "https:") return "source URL is not https";
  } catch {
    return "source URL is not a valid URL";
  }
  if (item.titleEn.length > 200 || item.titleMy.length > 200) return "title too long";

  if (mode === "event") {
    if (!item.startsAt?.trim()) return "event has no start time";
    if (!item.locationName?.trim()) return "event has no venue";
    const startsAt = new Date(item.startsAt);
    if (Number.isNaN(startsAt.getTime())) return "event start time is not a valid date";
    // The whole point of the events list is what a reader can still attend.
    // A past date is the failure this pass exists to prevent, and the model
    // gets it wrong often enough (misreading last year's listing) that it has
    // to be checked here rather than trusted.
    if (startsAt.getTime() < Date.now()) return "event has already happened";
  }

  if (mode === "directory") {
    if (!item.website?.trim()) return "directory entry has no website";
    try {
      if (new URL(item.website).protocol !== "https:") return "website is not https";
    } catch {
      return "website is not a valid URL";
    }
  }

  return null;
}

/**
 * How long a country may go uncovered before the agent must go looking.
 *
 * Coverage drifts on its own. English-language sources about Myanmar workers
 * in Singapore are simply easier to find than sources about Bangladeshi or
 * Chinese ones, so an agent told only to "find good items" will keep
 * rediscovering the same community and the portal quietly becomes a
 * single-nationality service again — which is the state we are deliberately
 * leaving.
 *
 * So coverage is measured, not hoped for: any country with no item of its own
 * inside this window is named in the prompt as a country to search for first.
 * This is a floor on attention, never a licence to invent — a country with
 * genuinely no news that week still yields nothing, and that is a correct
 * outcome.
 */
const COUNTRY_QUOTA_DAYS = 30;

/**
 * News is not the only thing the portal carries.
 *
 * Events and directory entries answer a different question — "what is on this
 * weekend", "where do I go for help" — and they have their own fields, their
 * own freshness rules and their own failure modes. A dated event that has
 * already passed is worse than no event; a directory entry with a dead phone
 * number sends someone across the island for nothing. So each gets its own
 * pass with its own instructions rather than being squeezed into the news
 * shape.
 */
const EVENT_PROMPT = `Find upcoming events in Singapore that a migrant worker or new resident could actually attend.

WHAT COUNTS: free or low-cost events with a confirmed date, time and venue — migrant-worker centre activities, free legal or medical clinics, skills and language classes, embassy consular outreach days, cultural and religious festivals for the Myanmar, Indian, Chinese, Bangladeshi and Malaysian communities, job fairs run by government agencies or licensed organisers.

HARD RULES
- The event must be in the FUTURE. An event whose date has passed is a defect, not a stale item.
- Date, time and venue must all appear on the page you retrieved. If any is missing or vague ("later this month"), skip the event.
- Organiser must be a government agency, an embassy or high commission, a registered NGO/charity, or an established community organisation. Never an individual, and never anything charging a fee to attend a job-related event.
- startsAt must be a full ISO 8601 timestamp with the +08:00 Singapore offset, e.g. "2026-09-20T10:00:00+08:00". Never invent a time to satisfy the format — if the page gives no time, skip the event.

Additional output fields for each item, alongside the usual ones:
"startsAt" (required), "endsAt" (optional, same format), "locationName" (venue name, required), "address" (street address, optional).`;

const DIRECTORY_PROMPT = `Find services in Singapore that a migrant worker or new resident can walk into or call for help.

WHAT COUNTS: migrant worker centres, NGO helplines and casework services, free or subsidised clinics, government service counters (MOM, TADM, ICA, CPF), embassy and high commission consular counters, MAS-licensed remittance outlets, legal aid clinics.

HARD RULES
- Every phone number, address and opening hours must appear on the organisation's OWN website, which you retrieved. Never take contact details from a directory site, a news article or a listing aggregator — those go stale silently and a dead number is the whole failure mode here.
- Only organisations, never individual people, agents or brokers.
- Never a private employment agency, moneylender, or buy-now-pay-later provider.
- If you cannot find current opening hours on the official page, omit openingHours rather than guessing.
- sourceUrl must be the organisation's own page.
- The body should say plainly what the service does and who may use it — including whether it is free.

Additional output fields for each item, alongside the usual ones:
"phone" (optional, in +65 format), "website" (required, the organisation's own URL), "openingHours" (optional, plain text as published), "address" (optional), "isFree" (boolean, true only if the page says the service is free).

These entries are reference material, not news, so sourcePublishedAt and the 7-day recency rule do not apply.`;

type ResearchMode = "news" | "event" | "directory";

async function researchCategory(
  client: Anthropic,
  category: ContentCategory,
  knownSourceUrls: string[],
  recentTitles: string[],
  mode: ResearchMode = "news",
  underserved: CountryCode[] = [],
): Promise<{ items: ResearchItem[]; error: string | null }> {
  const today = new Date().toISOString().slice(0, 10);

  const brief =
    mode === "event"
      ? EVENT_PROMPT
      : mode === "directory"
        ? DIRECTORY_PROMPT
        : `Research the "${category}" topic for Singapore: ${CATEGORY_BRIEF[category]}`;

  // Naming the gap is what makes the quota real. A generic "cover all
  // nationalities" instruction reliably loses to whichever community has the
  // most English-language sources.
  //
  // But only where nationality is actually a dimension of the topic. A train
  // closure is not Bangladeshi or Chinese, and telling the model to prioritise
  // a country on a transport pass invites it to force a national angle onto a
  // story that has none — which is how you get subtly wrong framing.
  const countryRelevant =
    mode !== "news" || ["work", "community", "money"].includes(category);

  const coverageNote =
    countryRelevant && underserved.length > 0
      ? `\nCOVERAGE GAP — these countries have had nothing of their own for ${COUNTRY_QUOTA_DAYS} days: ${underserved
          .map((code) => COUNTRIES.find((c) => c.code === code)?.englishName ?? code)
          .join(", ")}. Search their communities and their missions in Singapore FIRST. If you genuinely find nothing for them, return nothing rather than padding — but look there before you look anywhere else.\n`
      : "";

  const userPrompt = `Today is ${today}. ${brief}
${coverageNote}
Return at most ${MAX_ITEMS_PER_CATEGORY} items, and fewer (or none) if nothing genuine and recent exists.

Already covered — do NOT return these source URLs again:
${knownSourceUrls.slice(0, 60).map((u) => `- ${u}`).join("\n") || "- (none yet)"}

Already covered — do not repeat these stories:
${recentTitles.slice(0, 40).map((t) => `- ${t}`).join("\n") || "- (none yet)"}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: MAX_SEARCHES_PER_CATEGORY,
        } as unknown as Anthropic.Tool,
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return { items: parseItems(text), error: null };
  } catch (err) {
    return { items: [], error: err instanceof Error ? err.message : "unknown error" };
  }
}

export async function runDailyResearch(
  budgetMs = DEFAULT_BUDGET_MS,
): Promise<{ summary: ResearchSummary | null; error: string | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { summary: null, error: "ANTHROPIC_API_KEY is not configured." };

  const supabase = serviceClient();
  if (!supabase) return { summary: null, error: "Supabase service role is not configured." };

  const startedAt = Date.now();
  const client = new Anthropic({ apiKey });

  // What is already covered, and which topics and countries have gone quiet.
  //
  // `country` is selected optionally: the column ships in a migration that may
  // not be applied yet, and a research run that refuses to start because of a
  // pending migration would be a worse failure than one without the quota.
  const BASE_COLUMNS = "title_en,source_url,category,status,published_at,created_at";
  let hasCountryColumn = true;

  type ExistingRow = {
    title_en: string;
    source_url: string | null;
    category: string;
    status: string;
    published_at: string | null;
    created_at: string | null;
    country?: string | null;
  };

  const readWith = (columns: string) =>
    supabase
      .from("content_items")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<ExistingRow[]>();

  let read = await readWith(`${BASE_COLUMNS},country`);

  if (read.error?.code === "42703") {
    hasCountryColumn = false;
    logServerEvent("warn", "daily_research_country_column_missing", {});
    read = await readWith(BASE_COLUMNS);
  }

  const { data: existing, error: readError } = read;
  if (readError) return { summary: null, error: readError.message };

  const rows = existing ?? [];
  const knownSourceUrls = [
    ...new Set(rows.map((r) => r.source_url).filter((u): u is string => Boolean(u))),
  ];
  const recentTitles = rows.map((r) => r.title_en).filter(Boolean);

  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const freshByCategory = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "published" || !row.published_at) continue;
    if (new Date(row.published_at).getTime() < cutoff) continue;
    freshByCategory.set(row.category, (freshByCategory.get(row.category) ?? 0) + 1);
  }

  // Quietest topics first, so coverage evens out over the week.
  const ordered = [...CONTENT_CATEGORIES].sort(
    (a, b) => (freshByCategory.get(a) ?? 0) - (freshByCategory.get(b) ?? 0),
  );

  // Countries with nothing of their own inside the quota window. Anything not
  // yet published still counts as covered — an item waiting in the review
  // queue means the gap has already been worked, and re-researching it would
  // just queue a duplicate for the same admin to reject.
  const countryCutoff = Date.now() - COUNTRY_QUOTA_DAYS * 24 * 60 * 60 * 1000;
  const coveredCountries = new Set<string>();
  if (hasCountryColumn) {
    for (const row of rows) {
      if (!row.country) continue;
      const at = row.created_at ? new Date(row.created_at).getTime() : NaN;
      if (Number.isNaN(at) || at < countryCutoff) continue;
      coveredCountries.add(row.country);
    }
  }
  const underserved: CountryCode[] = hasCountryColumn
    ? COUNTRIES.map((c) => c.code).filter((code) => !coveredCountries.has(code))
    : [];

  const summary: ResearchSummary = {
    categoriesAttempted: [],
    inserted: 0,
    duplicates: 0,
    rejected: [],
    errors: [],
    timedOut: false,
  };

  /** One research call plus its inserts. Shared by all three passes. */
  const runPass = async (category: ContentCategory, mode: ResearchMode) => {
    const label = mode === "news" ? category : `${mode}/${category}`;
    summary.categoriesAttempted.push(category);

    const { items, error } = await researchCategory(
      client,
      category,
      knownSourceUrls,
      recentTitles,
      mode,
      underserved,
    );

    if (error) {
      summary.errors.push(`${label}: ${error}`);
      return;
    }

    for (const item of items.slice(0, MAX_ITEMS_PER_CATEGORY)) {
      const problem = validate(item, mode);
      if (problem) {
        summary.rejected.push({ reason: problem, title: item?.titleEn ?? "(untitled)" });
        continue;
      }
      if (knownSourceUrls.includes(item.sourceUrl)) {
        summary.duplicates += 1;
        continue;
      }

      const row: Record<string, unknown> = {
        type: mode,
        category,
        priority: item.priority === "urgent" || item.priority === "high" ? item.priority : "normal",
        slug: generateSlug(item.titleEn),
        title_en: item.titleEn.trim(),
        title_my: item.titleMy.trim(),
        summary_en: item.summaryEn?.trim() || null,
        summary_my: item.summaryMy?.trim() || null,
        body_en: item.bodyEn.trim(),
        body_my: item.bodyMy.trim(),
        source_url: item.sourceUrl.trim(),
        source_name: item.sourceName?.trim() || null,
        source_published_at: item.sourcePublishedAt?.trim() || null,
        starts_at: mode === "event" ? item.startsAt?.trim() || null : null,
        ends_at: mode === "event" ? item.endsAt?.trim() || null : null,
        location_name:
          mode === "event" || mode === "directory" ? item.locationName?.trim() || null : null,
        address:
          mode === "event" || mode === "directory" ? item.address?.trim() || null : null,
        phone: mode === "directory" ? item.phone?.trim() || null : null,
        website: mode === "directory" ? item.website?.trim() || null : null,
        opening_hours: mode === "directory" ? item.openingHours?.trim() || null : null,
        is_free: mode === "directory" ? item.isFree ?? null : null,
        status: "pending",
        created_by: "agent",
      };

      // Null means "applies to everyone", which is the normal case. Only a
      // genuinely nationality-specific item carries a country.
      if (hasCountryColumn && isCountryCode(item.country)) {
        row.country = item.country;
      }

      let insertError = (await supabase.from("content_items").insert(row)).error;

      // The column may arrive between the read above and this write; drop it
      // and keep the item rather than losing a verified piece of research.
      if (insertError?.code === "42703" && "country" in row) {
        delete row.country;
        insertError = (await supabase.from("content_items").insert(row)).error;
      }

      if (insertError) {
        // 23505 is the unique index on source_url doing its job.
        if (insertError.code === "23505") summary.duplicates += 1;
        else summary.errors.push(`${label} insert: ${insertError.message}`);
        continue;
      }

      knownSourceUrls.push(item.sourceUrl);
      recentTitles.push(item.titleEn);
      summary.inserted += 1;
    }
  };

  const outOfTime = () => Date.now() - startedAt > budgetMs;

  for (const category of ordered) {
    // Leave room for one more call plus its inserts before the platform kills us.
    if (outOfTime()) {
      summary.timedOut = true;
      break;
    }
    await runPass(category, "news");
  }

  // Events and directory entries run last and only if the budget allows. News
  // is the reason someone opens the app today; these two accumulate, so a day
  // where they are skipped costs almost nothing, while a day with no news is
  // an empty home page.
  if (!outOfTime()) {
    await runPass("community", "event");
  }
  if (!outOfTime()) {
    await runPass("community", "directory");
  }

  logServerEvent("info", "daily_research_complete", {
    inserted: summary.inserted,
    duplicates: summary.duplicates,
    rejected: summary.rejected.length,
    errors: summary.errors.length,
    timedOut: summary.timedOut,
    durationMs: Date.now() - startedAt,
  });

  return { summary, error: null };
}
