# Owner Income Playbook — ဝင်ငွေရှာဖွေရေး လက်တွေ့အစီအစဉ်

## Goal

Build a trusted, affordable service for Myanmar migrant workers in Singapore while creating sustainable owner income.

**Current product reality:** the app already has authentication, a passport form draft, KPay/WavePay payment submission, receipt upload, and admin payment review. PDF generation and paid-access unlocking are not implemented yet. Start by proving demand with the existing S$2 payment flow before building subscriptions or complex advertising.

## Owner principles

- Keep essential safety information, emergency contacts, and basic guides free.
- Charge for convenience or business visibility—not access to workers' rights.
- Show the full price before payment. Do not use hidden fees or recurring billing by default.
- Label every paid placement clearly as **Sponsored** or **Featured** in English and Myanmar.
- Collect only data needed to provide the service. Never sell passport, FIN/NRIC, contact, payment, or usage data.
- Do not promise visa, job, passport, or government approval outcomes.
- Track revenue by stream every week; stop offers that damage trust or produce repeated complaints.

## 1. Premium PDF export — ပရီမီယံ PDF

### Recommended pricing

- **Free:** checklist, guide, form preview, and saved draft.
- **S$2 Basic Export:** one completed passport-renewal PDF download.
- **S$5 Document Pack:** up to three exports or corrections within 30 days.
- **S$9 Supporter Pack (later):** Document Pack plus one owner-checked completeness review. This is an administrative check, not legal advice or guaranteed acceptance.

Launch only the **S$2 Basic Export** first because the current payment form already defaults to `passport_renewal_pdf_export` and S$2 SGD. Add the other tiers only after at least 20 successful paid exports and clear demand for corrections.

### Setup in the current codebase

1. Complete the PDF field-mapping proof of concept listed in `README.md`.
2. Keep the wizard preview free; require login only when the user chooses export.
3. Use a fixed product/purpose code for each tier instead of allowing users to type the payment purpose or price.
4. Reuse the existing manual payment page for KPay/WavePay and private receipt upload.
5. After admin marks a payment `completed`, create an export entitlement tied to the user, product, usage limit, and expiry date.
6. Check the entitlement on the server before generating each PDF. Do not unlock based only on a browser button or receipt upload.
7. Add a simple account view showing payment status, remaining exports, and expiry.
8. Record only operational events: preview started, payment submitted, payment approved, export succeeded, and export failed. Do not include passport or FIN/NRIC values in analytics.

### KPI targets for the first 30 days

- Wizard-to-payment conversion: **5%–10%**
- Submitted-to-approved payment rate: **80%+**
- Approved-to-successful export rate: **95%+**
- Median admin approval time: **under 12 hours**
- Refund/rework rate: **under 5%**
- Target: **20 paid exports** to validate willingness to pay

### Risks and compliance

- Passport and FIN/NRIC data are highly sensitive. Apply Singapore PDPA principles: clear purpose, minimum collection, protected access, limited retention, and a deletion/contact process.
- Never show personal form data in admin payment review; the reviewer needs payment evidence, not passport details.
- Receipts may expose names, phone numbers, and transaction IDs. Keep the storage bucket private and use short-lived signed links.
- State clearly that the PDF is a preparation tool, not an official government service.
- Keep a hardship option: users who cannot pay can still access the free checklist and information.

## 2. Sponsored placements and ads — ကြော်ငြာ

### Practical offer and pricing

- **Pilot sponsor card:** S$80 per week on one relevant page.
- **Monthly sponsor:** S$250 per month for a fixed placement on the home or guide page.
- Limit launch inventory to one sponsor per page. Prefer useful, trusted services such as remittance education, SIM plans, training, clinics, or Myanmar groceries.
- Avoid third-party behavioral ad networks at launch. Direct sponsorship gives the owner more control and requires less user tracking.

### Setup in the current codebase

1. Start manually with a small sponsored-card component on the home or guide page.
2. Store sponsor name, approved copy, target URL, start/end dates, locale, placement, and active status.
3. Add an admin-only approval and pause control before accepting multiple advertisers.
4. Display a visible **Sponsored / အခပေးကြော်ငြာ** label beside every placement.
5. Track impressions and outbound clicks without worker identity or sensitive form data.
6. Use a simple insertion order/invoice stating dates, placement, price, creative rules, and no guaranteed results.

### KPI targets

- Sponsor fill rate: **50%+** of available weekly slots by month two
- Click-through rate: **1%–3%** for relevant direct sponsors
- Sponsor renewal rate: **40%+**
- Revenue per 1,000 page views: monitor weekly; target **S$10+** during the pilot
- User complaints or misleading-ad reports: **under 1% of clicks**

### Risks and compliance

- Paid content must be unmistakably disclosed; do not style it as government advice or an independent recommendation.
- Get consent before sharing any lead details with a sponsor. A click must not automatically transmit a user's profile, phone number, or document data.
- Reject payday loans, illegal recruitment, unlicensed agencies, gambling, exploitative remittance offers, and services that retain passports.
- Review sponsor claims and landing pages before launch and weekly while active.
- Keep editorial guides independent. Payment must never buy a false safety or government-approval claim.

## 3. B2B agency featured listings — Agency များအတွက်

### Practical offer and pricing

- **Free verified profile:** basic agency information and licence details.
- **S$49/month Featured:** highlighted profile and placement in one relevant category.
- **S$129/month Campaign:** Featured placement plus one clearly labelled sponsor card and a monthly performance summary.
- Offer a **30-day S$39 pilot** to the first three agencies in exchange for feedback.

Do not launch paid featured listings until the app has agency/listing pages, verification, expiry handling, and a way for users to report a listing.

### Setup in the current codebase

1. Add agency and listing records with licence number, country, verification status, suspension status, and owner account.
2. Verify Singapore employment-agency licence details against the appropriate Ministry of Manpower source before displaying **Verified**.
3. Add admin review for agency documents and listing content.
4. Reuse the existing payments and admin-review workflow for the pilot; use a fixed purpose such as `agency_featured_30_day`.
5. Activate `featured_until` only after a payment is completed and agency verification passes.
6. Rank by transparent rules. A featured agency receives visibility, not a false quality score or guaranteed leads.
7. Add **Featured / အခပေးဦးစားပေး** labels and a report button.
8. Send agencies a simple monthly report: views, profile opens, outbound contacts, and reports.

### KPI targets

- Verified agencies contacted: **20** in the first sales cycle
- Pilot close rate: **10%–20%**
- Featured listing click-through rate: **3%–8%**
- Contact/lead conversion from profile views: **5%+**
- Monthly agency renewal rate: **60%+**
- Verified serious complaints: **zero tolerance; investigate all**

### Risks and compliance

- Confirm licensing and advertising requirements before listing employment agencies or job offers. Keep an evidence date for every verification.
- Never let payment bypass verification or moderation.
- Do not charge workers to access a job lead or contact an agency. Agency marketing fees should be paid by the business.
- Ban recruitment claims such as “guaranteed work pass,” hidden placement fees, discriminatory criteria, or passport retention.
- Publish an easy complaint route and pause disputed listings during investigation.

## 4. NGO and grant partnerships — NGO / Grant

### Practical offer

- Seek **S$2,000–S$10,000** pilot grants for Myanmar-language document education, safe-migration guides, or digital literacy.
- Offer NGOs a sponsored public-resource programme, anonymised impact report, or co-produced guide.
- Keep emergency contacts and rights content free even when grant funding ends.

### Setup in the current codebase

1. Prepare a two-page partner brief: user problem, current features, target audience, safeguards, 90-day outcomes, and budget.
2. Create a dedicated partner contact email and a basic partner page.
3. Add consent-based, privacy-safe impact events such as guide opened, checklist completed, and language used.
4. Report only aggregate results. Set a minimum reporting group size, for example 20 users, to reduce re-identification risk.
5. Maintain a simple grant tracker with funder, contact, deadline, requested amount, restrictions, decision, and reporting date.
6. Put deliverables, data access, branding, payment schedule, and content independence in a written agreement.

### KPI targets

- Qualified organisations contacted: **10 per month**
- Introductory meetings: **3 per month**
- Proposals submitted: **2 per month**
- Grant win rate: planning target **10%–25%**
- Cost per beneficiary and completion rate: define per funded programme
- Partner reporting delivered on time: **100%**

### Risks and compliance

- Do not give a funder raw user records, contact details, document fields, or payment receipts.
- Obtain specific consent for research interviews or testimonials; service access must not depend on consent.
- Disclose partner funding on funded content while preserving editorial independence.
- Avoid duplicate counting and inflated impact claims. Keep calculation notes for every reported KPI.
- Check grant restrictions before spending; some funds cannot be used as unrestricted owner income. Budget a clearly stated owner/project-management fee where allowed.

## 5. Optional affiliate referrals — မိတ်ဖက်ညွှန်းဆိုခ

### Practical offer

Start only after user trust and traffic are stable. Prefer a fixed referral fee over commission linked to how much a worker spends.

- Test one low-risk category, such as a training course or transparent SIM plan.
- Negotiate **S$5–S$20 per verified referral** or a clearly documented flat campaign fee.
- Never make an affiliate the only path to essential help.

### Setup in the current codebase

1. Create a reviewed affiliate-partner list with category, destination URL, disclosure text, payout rule, and active dates.
2. Add a redirect endpoint or outbound-click event using a random click ID—not passport number, FIN/NRIC, email, or user ID.
3. Add **Affiliate link / ဝယ်ယူပါက ကော်မရှင်ရနိုင်သည်** beside the call to action.
4. Reconcile partner conversion reports monthly against click IDs and invoices.
5. Provide a non-affiliate alternative where practical and let users continue without clicking.

### KPI targets

- Affiliate click-through rate: **1%–4%**
- Verified conversion rate: **2%–8% of clicks**
- Revenue per outbound click: track by partner
- Reversal/invalid conversion rate: **under 10%**
- Complaints: **under 1% of referred users**

### Risks and compliance

- Obtain consent before sending personal lead information. A normal outbound click should share no profile or sensitive document data.
- Clearly disclose the commercial relationship before the click.
- Reject debt, gambling, unlicensed recruitment, high-pressure sales, and products with unclear fees.
- Do not rank services only by commission. Use suitability, safety, price transparency, and complaint history.
- End the partnership immediately if the destination changes to misleading or exploitative content.

## Simple owner dashboard

Review these numbers every Monday:

- Cash received, refunds, and net revenue by stream
- Pending payments and median approval time
- Paid exports, failed exports, and support requests
- Sponsor/featured impressions, clicks, complaints, and renewals
- Partner outreach, meetings, proposals, and grant pipeline value
- Affiliate clicks, confirmed conversions, reversals, and complaints

Use planning targets as experiments, not promises. After four weeks, keep the stream only if it creates income **and** maintains user trust.

## 30-day execution plan

### Week 1 — Validate the paid-export foundation

- Run the full current journey: register → login → wizard draft → manual payment → receipt upload → admin approval.
- Confirm all listed Supabase migrations have been applied and the receipt bucket is private.
- Fix the customer offer at **S$2 for one PDF export**; do not launch extra tiers yet.
- Write the English/Myanmar price, refund, privacy, and “not a government service” notices.
- Define the five core events without personal document fields.
- Interview five target users about willingness to pay and payment friction.

**Owner outcome:** one safe, clearly priced offer and a tested payment operation.

### Week 2 — Deliver and measure the first paid exports

- Complete PDF mapping and server-side entitlement checks.
- Add payment status and export access to the account page.
- Process the first payments manually within a published response window.
- Recruit 10–20 pilot users through trusted community groups; avoid spam.
- Record conversion, approval time, export success, corrections, refunds, and support questions.
- Collect feedback only with explicit consent; anonymise public quotes.

**Owner outcome:** first paying users and evidence of where the flow fails.

### Week 3 — Sell one direct sponsorship pilot

- Prepare a one-page sponsor media sheet with audience, placement, price, disclosure policy, and prohibited categories.
- Create a list of 15 relevant, reputable local businesses or community organisations.
- Contact five prospects per day with the **S$80 one-week pilot**.
- Review sponsor identity, claims, destination page, and complaints before accepting payment.
- Publish no more than one clearly labelled sponsor card.
- Start outreach to five NGOs with the two-page partner brief.

**Owner outcome:** first B2B conversation and ideally one paid sponsor pilot.

### Week 4 — Review, improve, and choose the next stream

- Compare actual results with the KPI targets.
- Calculate owner time per approved payment and support case.
- Ask paid users whether they needed repeat exports; add the S$5 pack only if demand is real.
- Ask the sponsor for renewal based on a simple, privacy-safe result summary.
- Submit one or two NGO/grant proposals.
- Decide the next build:
  - agency listings if verified agencies are ready to pay;
  - export automation if manual administration is too slow;
  - no affiliate work unless a trusted, low-risk partner is available.
- Publish a short monthly transparency note: paid placements, complaints received, and actions taken.

**Owner outcome:** a data-based decision for month two, not five unfinished revenue features.

## Do now — လက်ရှိ feature များနဲ့ ချက်ချင်းလုပ်ရန်

- [ ] Create one owner test account and one admin account.
- [ ] Confirm registration, login, logout, and protected account access work.
- [ ] Complete a passport draft and verify it saves after login.
- [ ] Submit a **S$2 SGD** KPay/WavePay test payment with purpose `passport_renewal_pdf_export`.
- [ ] Upload a test image/PDF receipt and confirm only its private storage path is saved.
- [ ] Open the admin payment page, review the receipt using a signed URL, add a note, and mark the payment completed.
- [ ] Repeat once with a failed payment and a clear rejection reason.
- [ ] Confirm an ordinary user cannot view another user's payment or receipt.
- [ ] Set a daily time to review pending payments; initial service promise: within 12 hours.
- [ ] Keep a manual sales log: date, anonymous payment ID, product, amount, status, approval time, refund, and support issue.
- [ ] Add owner-facing wording for price, approval time, refund handling, privacy, and paid-placement disclosure before inviting real users.
- [ ] Do not take real export payments until a completed payment reliably unlocks a working PDF.
- [ ] Contact five pilot users only after the end-to-end export is tested.
- [ ] Delay ads, featured agencies, and affiliates until the S$2 paid export flow has real usage data.

## First-month success definition

Month one is successful if the app safely completes **20 paid exports**, keeps export failures and refunds below **5%**, approves most payments within **12 hours**, receives no unresolved privacy complaints, and produces at least one serious sponsor or NGO conversation. Trust and repeatable operations come before maximum short-term revenue.
