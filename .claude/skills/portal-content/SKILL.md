---
name: portal-content
description: Editorial standards and submission contract for SG Migrant Worker App portal content (news, alerts, events, directory, exchange rates). Use when researching, writing, reviewing, or submitting any bilingual EN/MY content for the app, or when editing the daily research agent's brief.
---

# Portal Content Standards

Editorial rules for every item published to the SG Migrant Worker App portal. These
apply to the automated daily research agent, to admin-written posts, and to any
Claude session that drafts or reviews content.

## Who Hello SG is for

**Anyone who has to understand Singapore in a second language.**

That is the ~1.6 million people here on a work pass (MOM, June 2025: Work Permit
1,182,500 · S Pass 177,600 · Employment Pass 201,200), plus their families,
foreign students, new PRs, and residents who read Chinese, Tamil, Malay or
Bengali more comfortably than English. Readers come mainly from **Myanmar,
India, China, Bangladesh and Malaysia**.

Assume:

- English may be limited, and is often not their first language.
- Possibly limited formal education. Avoid jargon, legalese, and long sentences.
- Reading on a phone, often on a rest day, often on limited data.
- **High stakes**: they may act on what we publish (send money, quit a job, sign a
  document, skip a deadline). Wrong information causes real harm.

Write like you are explaining to a friend who just arrived and is worried about
getting something wrong.

### What we are not

We are not a general Singapore news site, and we do not compete with CNA or the
Straits Times. **We compete with someone not finding out at all, because the
information only existed in English.**

That is the test for every item: *would a reader miss this, or misunderstand it,
because of language?* A story already everywhere in plain English, carrying no
consequence for our readers, is not for us — however big it is.

### Balance across the five countries

The portal serves five nationalities and must not read as a service for one of
them. Coverage drifts on its own: English-language sources about Myanmar workers
in Singapore are easier to find than sources about Bangladeshi or Chinese ones,
so "find good items" alone reliably rebuilds a single-nationality portal.

- Most Singapore rules — MOM, transport, health, scams, money — **apply to
  everyone**. Write them for everyone. Never frame a general Singapore rule as a
  Myanmar matter just because Myanmar workers are affected by it.
- An item tied to one nationality (a consular notice, a home-country remittance
  requirement, a national holiday) must **name that country in the title** and
  set the `country` field, so a reader it does not concern can skip it.
- `country` is null for everything else. **Null is the normal case.**
- **Quota**: no country should go more than 30 days without an item of its own.
  The daily agent is told which countries are behind and searches those first.
  This is a floor on *attention*, never a licence to invent — a country with
  genuinely no news that week still yields nothing, and that is correct.

The fix for imbalance is never to publish less about Myanmar. It is to reach the
same standard for the other four.

The reader's home country is a setting in the app (`src/lib/countries.ts`),
separate from their reading language. Someone may read English and remit to Dhaka.

## Non-negotiable rules

1. **Never fabricate.** Every factual claim — a policy, a fee, a date, a rate, an
   address, a phone number — must come from a real source you actually retrieved.
   No "typically", no "usually around", no filling gaps from memory.
2. **Every item needs a working source URL.** If you cannot produce one, do not
   submit the item.
3. **Nothing published without human approval.** All agent submissions enter the
   queue as `pending`. Never attempt to publish directly.
4. **Publish nothing rather than something weak.** An empty day is fine and
   expected. Do not pad the feed to hit a number.
5. **No medical, legal, or immigration advice in our own voice.** Report what the
   source says and link to it. Point to the official body or a real support
   organisation (MOM, TADM, MWC, HOME, TWC2) rather than telling someone what to do.
6. **No personal data.** Never publish an individual worker's name, photo, FIN,
   passport number, employer, or case details, even from a public news story.

## Category taxonomy

| Category | Covers |
|---|---|
| `mom_policy` | **Work & Pass** — rules that govern living and working here: MOM work passes, levies, rest days, contracts, workplace safety, plus ICA pass/PR matters and CPF changes affecting pass holders |
| `embassy` | **Consular** — notices from any of the five missions in Singapore (Myanmar, India, China, Bangladesh, Malaysia): passport/ID services, appointments, opening hours, document requirements. Name the country in the title. |
| `safety_scam` | Scams, loan sharks, deceptive agents, fake job offers, police/MOM advisories |
| `finance` | Remittance channels, bank/wallet changes, fees, the 25% official-channel remittance rule |
| `legal` | Salary claims (TADM), injury compensation, contract disputes, rights enforcement, free legal aid |
| `health` | Clinics, medical insurance, MOM medical requirements, mental health support |
| `community` | Community events and gatherings for any of the five communities: festivals, religious observances, migrant-worker centres, relief drives. Say who the event is for. |
| `education` | Skills training, language classes, certification, free courses for migrant workers |
| `transport` | MRT/bus disruptions, planned closures, fare changes, new lines and stations |
| `jobs` | Hiring notices and job fairs — official sources only, see the rule below |
| `housing` | Renting a room or flat: tenancy rights, deposits, HDB/URA subletting rules, agent fees, dormitory standards, utilities and disputes |
| `cost_of_living` | GST and GST Vouchers, CDC vouchers, U-Save rebates, transport concessions, subsidy schemes — **always state who qualifies** |

Pick the single most relevant category. If an item fits none of these cleanly, it is
probably not for us.

## Content types

Every item is one of three types, and they answer different questions.

**`news`** — what changed. Everything above.

**`event`** — what a reader can attend. Free or low-cost, with a **confirmed date,
time and venue** that all appear on the page you retrieved. If any of the three is
missing or vague ("later this month"), skip it rather than guessing.

- The event must be in the **future**. A past date is the defect this type exists to
  avoid, and it is checked on insert — misreading last year's listing is the common
  way it happens, so verify the year.
- `startsAt` is full ISO 8601 with the Singapore offset: `2026-09-20T10:00:00+08:00`.
  Never invent a time to satisfy the format.
- Organiser must be a government agency, an embassy or high commission, a registered
  NGO/charity, or an established community organisation. Never an individual, and
  never anything charging a fee to attend a job-related event.
- Extra fields: `startsAt` (required), `endsAt`, `locationName` (required), `address`.

**`directory`** — where to go for help. Standing services, not news: migrant worker
centres, NGO helplines, free or subsidised clinics, government service counters,
consular counters, MAS-licensed remittance outlets, legal aid clinics.

- Every phone number, address and opening hour must come from the organisation's
  **own website**, which you retrieved. Never from a directory site, a news article
  or a listing aggregator — those go stale silently, and a dead number that sends
  someone across the island for nothing is the whole failure mode here.
- Organisations only. Never an individual, agent or broker. Never a private
  employment agency, moneylender, or buy-now-pay-later provider.
- If current opening hours are not on the official page, omit them rather than guess.
- Say plainly what the service does, who may use it, and whether it is free.
- Extra fields: `website` (required), `phone`, `openingHours`, `address`, `isFree`.
- Reference material, so the 7-day recency rule does not apply.

## Job postings — the strictest rule in this document

Fake job offers are one of the most common and most damaging scams aimed at this
audience. A worker who believes a fake listing can lose an agency fee, a passport,
or their legal status. Treat this category as dangerous by default.

**Only ever post:**
- Openings on official government portals (MyCareersFuture, Workforce Singapore)
- Job fairs and hiring events run by government agencies, MOM-licensed employment
  agencies, embassies, or established NGOs
- Government hiring schemes and their eligibility rules

**Never post:**
- An individual job advert from Facebook, Telegram, TikTok, WhatsApp or any group chat
- Any listing that asks the worker to pay a fee, deposit, or "processing charge"
- Any listing from an agency you cannot verify against MOM's licensed-agency register
- Any listing with a personal phone number or personal account as the contact
- Anything promising unusually high pay, guaranteed placement, or fast visas

When in doubt, do not post it. A missed real opening costs nothing; one fake listing
can cost someone everything they have. Where useful, point people to the official
portal to search for themselves rather than reproducing a specific vacancy.

## Cost of living — always state eligibility

Most Singapore support schemes are for **citizens and permanent residents only**.
GST Vouchers, CDC vouchers, U-Save rebates and Assurance Package payouts do not
go to Work Permit, S Pass or Employment Pass holders.

An item about a payout that does not say who qualifies will be read by a pass
holder as money coming to them. Every `cost_of_living` item must state the
eligibility in the summary, not buried in the body — and if a scheme excludes
most of our readers, say that in the first sentence.

Price and fare changes (GST rate, bus and MRT fares, utility tariffs) apply to
everyone and are worth covering plainly.

## Transport

Report planned and confirmed disruptions — track closures, early/late openings, bus
service changes, fare revisions — from LTA, SMRT, SBS Transit, or reputable reporting
on them. Say clearly which line/service, which stations, and the dates. Do not report
live minute-by-minute delays: by the time an item is approved and published it is
already wrong.

## Weather, haze and UV

Do **not** submit these as content items. Live readings come straight from NEA's
public API and are rendered on the home page automatically. Only submit a
weather-related item when there is genuine *news* — a prolonged haze episode with
health advisories, a monsoon warning affecting outdoor work — and file it under
`health`.

## Source credibility tiers

**Tier 1 — official, always acceptable as sole source**
`mom.gov.sg`, `tal.sg` / TADM, `police.gov.sg` / `scamalert.sg`, `cpf.gov.sg`,
`ica.gov.sg`, `moh.gov.sg`, `myanmarembassy.sg`, `mwc.org.sg`, `lta.gov.sg`,
`smrt.com.sg`, `sbstransit.com.sg`, `nea.gov.sg`, `mycareersfuture.gov.sg`,
`wsg.gov.sg`, `gov.sg` and `data.gov.sg`

**Tier 2 — reputable, acceptable**
Straits Times, CNA, TODAY, Mothership, Yahoo SG, and the migrant-worker NGOs
TWC2 (`twc2.org.sg`) and HOME (`home.org.sg`)

**Tier 3 — needs a Tier 1/2 corroborating source before submitting**
Facebook groups, Telegram channels, TikTok, forum posts, community WhatsApp
messages, unattributed blogs

Never use content farms, scraped aggregators, or AI-generated news sites. For
anything about a Myanmar government rule, prefer the embassy or a Tier 2 report over
Myanmar-domestic outlets, which may be subject to state control or be unreachable.

## Recency

Only submit items dated within roughly the last 7 days, unless it is an ongoing
advisory that remains active and materially useful (e.g. a scam campaign still
running). Always state the date the source published, not the date you found it.

## Writing standards

**Both languages, every item.** English and Myanmar. Never submit one without the
other.

**Myanmar text:**
- **Unicode only, never Zawgyi.** Verify the encoding before submitting.
- Natural Myanmar, not a word-for-word translation of the English. Rewrite the idea.
- Everyday vocabulary over formal/literary register.
- Keep genuinely-English terms in English where Myanmar workers already use them:
  Work Permit, S Pass, FIN, MOM, TADM, PayNow, Singpass, levy. Do not invent
  Myanmar translations for these — it makes the text harder, not easier, to follow.
- **Re-read every Myanmar sentence for spelling and word choice before submitting.**
  Vocabulary errors have shipped before and were caught by users.

Known corrections (do not repeat these mistakes):

| Wrong | Correct | Note |
|---|---|---|
| ရက်ပေါက် | ပိတ်ရက် / နားရက် | "ရက်ပေါက်" is not a real word for a day off |

**Length and shape:**
- Title: max ~120 characters, states the actual news, no clickbait, no ALL CAPS.
- Summary: one sentence — what this means for the reader.
- Body: 2–5 short sentences. Lead with the practical consequence ("From 1 Oct you
  will need X"), then the detail, then where to go for help.

**Tone:** calm and factual. Do not use fear to drive engagement, even for scam
alerts — state the risk plainly and give the protective action.

## Deduplication

Before researching, fetch what is already in the feed:

```
GET /api/agent/brief   (Authorization: Bearer $AGENT_TOKEN)
```

This returns the current editorial brief plus recent published and pending item
titles and source URLs. Do not submit:

- The same `source_url` that already exists.
- The same underlying story already covered, even from a different outlet, unless
  there is a genuine material update — and then say what changed.

## Exchange rates

Rates are the highest-risk content we carry: a wrong number costs someone money.

- Only record a rate you read directly from the provider or a Tier 1/2 report.
- Always store the provider, the source URL, and the timestamp you observed it.
- Rates are always displayed as **indicative** with their observation time. Never
  present a rate as a guaranteed or live quote.
- Do not report routine daily fluctuation as news. Only submit a `finance` news item
  for a genuinely notable move or a policy/channel change.

**What the automated pipeline already does** (`src/lib/rateSync.server.ts`, run by
`/api/cron/rates`): it records the official mid-market SGD rate for **INR, CNY, BDT
and MYR** once a day. Do not duplicate those readings by hand.

**MMK is deliberately excluded from that sync.** Myanmar's official rate sits far
from what money changers and remittance services actually transact at — often close
to half — so storing it beside genuinely transactable readings would tell a worker
their family receives half what they will. It is surfaced separately and explicitly
labelled the official rate. If you ever obtain a real observed street rate, submit it
under its own provider with the time and place you observed it; never as the
mid-market figure.

## Submission format

**`country`** — set to `mm`, `in`, `cn`, `bd` or `my` only when the item is
specific to that one nationality. Null otherwise, which is the normal case. See
"Balance across the five countries" above.


One `POST` per item to `/api/content/submit` with `Authorization: Bearer $AGENT_TOKEN`:

```json
{
  "type": "news",
  "category": "mom_policy",
  "priority": "normal",
  "titleEn": "...",
  "titleMy": "...",
  "summaryEn": "...",
  "summaryMy": "...",
  "bodyEn": "...",
  "bodyMy": "...",
  "sourceUrl": "https://...",
  "sourceName": "MOM",
  "sourcePublishedAt": "2026-09-05"
}
```

- `type`: `news` | `event` | `directory`
- `priority`: `urgent` (immediate safety/deadline) | `high` | `normal`. Use `urgent`
  sparingly — it takes over the top of the homepage.
- `event` additionally takes `startsAt`, `endsAt`, `locationName`, `address`.
- `directory` additionally takes `phone`, `website`, `address`, `openingHours`,
  `languages`, `isFree`.

Payload must be valid JSON with properly escaped quotes and newlines. Verify the
response for each submission and report failures rather than silently continuing.

## Daily run report

After a run, always report: how many items submitted, their categories and titles,
which sources were checked, and — if nothing was submitted — what was searched and
why nothing met the bar. A quiet day with a clear report is a successful run.
