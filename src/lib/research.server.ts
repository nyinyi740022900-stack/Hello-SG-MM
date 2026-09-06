import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { CONTENT_CATEGORIES, generateSlug, type ContentCategory } from "@/lib/content";
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
  mom_policy: "MOM rules: work permits, S Pass, levies, rest days, employment contracts, workplace safety",
  embassy: "Myanmar Embassy Singapore: passport renewal, consular services, opening hours, document requirements",
  safety_scam: "Scams, loan sharks, deceptive employment agents, fake job offers, police/MOM advisories",
  finance: "Remittance channels and fees, bank/wallet changes, the 25% official-channel remittance rule",
  legal: "TADM salary claims, work injury compensation, contract disputes, free legal aid",
  health: "Clinics, medical insurance, MOM medical requirements, mental health support, haze health advisories",
  community: "Myanmar community events and gatherings in Singapore, embassy notices, relief drives",
  education: "Skills training, language classes, certification, free courses open to migrant workers",
  transport: "MRT/bus planned disruptions, track closures, fare changes, new lines and stations",
  jobs: "Hiring notices and job fairs from OFFICIAL sources only — see the jobs rule",
};

const SYSTEM_PROMPT = `You research daily updates for a bilingual (English/Myanmar) information portal used by Myanmar migrant workers and other residents in Singapore.

AUDIENCE: Myanmar is their first language; English may be limited. Many have limited formal education and read on a phone. They may ACT on what you write — send money, quit a job, sign a document, miss a deadline. Wrong information causes real harm.

NON-NEGOTIABLE RULES
1. Never fabricate. Every policy, fee, date, rate, address or phone number must come from a page you actually retrieved via web search. No "typically" or "usually around".
2. Every item needs a real, working source URL you actually opened.
3. Publish nothing rather than something weak. Returning zero items is a correct, expected outcome on a quiet day.
4. No medical, legal or immigration advice in your own voice. Report what the source says and point to the official body (MOM, TADM, MWC, HOME, TWC2).
5. No personal data: never include an individual worker's name, photo, FIN, passport number or employer, even from a public news story.
6. Only material dated within roughly the last 7 days, unless it is an ongoing advisory still in force.

SOURCES
Tier 1 (acceptable alone): mom.gov.sg, tal.sg/TADM, police.gov.sg, scamalert.sg, cpf.gov.sg, ica.gov.sg, moh.gov.sg, nea.gov.sg, lta.gov.sg, smrt.com.sg, sbstransit.com.sg, mycareersfuture.gov.sg, wsg.gov.sg, gov.sg, myanmarembassy.sg, mwc.org.sg
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
{"items":[{"titleEn":"","titleMy":"","summaryEn":"","summaryMy":"","bodyEn":"","bodyMy":"","sourceUrl":"","sourceName":"","sourcePublishedAt":"YYYY-MM-DD","priority":"normal"}]}
\`\`\`
priority is "urgent" only for an immediate safety risk or hard deadline, otherwise "normal".
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
function validate(item: ResearchItem): string | null {
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
  return null;
}

async function researchCategory(
  client: Anthropic,
  category: ContentCategory,
  knownSourceUrls: string[],
  recentTitles: string[],
): Promise<{ items: ResearchItem[]; error: string | null }> {
  const today = new Date().toISOString().slice(0, 10);

  const userPrompt = `Today is ${today}. Research the "${category}" topic for Singapore: ${CATEGORY_BRIEF[category]}

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

  // What is already covered, and which topics have gone quiet.
  const { data: existing, error: readError } = await supabase
    .from("content_items")
    .select("title_en,source_url,category,status,published_at")
    .order("created_at", { ascending: false })
    .limit(200);

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

  const summary: ResearchSummary = {
    categoriesAttempted: [],
    inserted: 0,
    duplicates: 0,
    rejected: [],
    errors: [],
    timedOut: false,
  };

  for (const category of ordered) {
    // Leave room for one more call plus its inserts before the platform kills us.
    if (Date.now() - startedAt > budgetMs) {
      summary.timedOut = true;
      break;
    }

    summary.categoriesAttempted.push(category);
    const { items, error } = await researchCategory(
      client,
      category,
      knownSourceUrls,
      recentTitles,
    );

    if (error) {
      summary.errors.push(`${category}: ${error}`);
      continue;
    }

    for (const item of items.slice(0, MAX_ITEMS_PER_CATEGORY)) {
      const problem = validate(item);
      if (problem) {
        summary.rejected.push({ reason: problem, title: item?.titleEn ?? "(untitled)" });
        continue;
      }
      if (knownSourceUrls.includes(item.sourceUrl)) {
        summary.duplicates += 1;
        continue;
      }

      const { error: insertError } = await supabase.from("content_items").insert({
        type: "news",
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
        status: "pending",
        created_by: "agent",
      });

      if (insertError) {
        // 23505 is the unique index on source_url doing its job.
        if (insertError.code === "23505") summary.duplicates += 1;
        else summary.errors.push(`${category} insert: ${insertError.message}`);
        continue;
      }

      knownSourceUrls.push(item.sourceUrl);
      recentTitles.push(item.titleEn);
      summary.inserted += 1;
    }
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
