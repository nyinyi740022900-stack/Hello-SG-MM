# Housing & Jobs listings — owner plan

News categories stay informational (`housing` / `work` tabs). **User-posted rooms and jobs are separate product boards**, not news posts.

## Why separate from news

- News = curated updates (admin / research), trust bar is high.
- Listings = user-generated, need moderation, reports, expiry, and clear “user-posted” labels.
- Mixing them would make scam ads look like Hello SG advice.

## Phase B — Jobs board — shipped (B.1)

1. Tables: `job_listings`, `job_applications`, `job_listing_reports`, `job_messages`.
2. Who can post: `profiles.role` ∈ `agency` | `admin` only.
3. Apply: login → cover note + optional CV (private `job-cvs`) → agency inbox at `/jobs/mine` with in-app messages.
4. Rules: reject fee-upfront phrasing; require MOM licence text; report → hide at 3; expire 45 days after publish; clear **Agency listing** label.
5. Post quotas (DB): **3/day · 15/month · max 5 active**. Same daily expire cron as housing.
6. Featured: KPay/WavePay `purpose=job_featured`, `reference_id=jobId`, ~S$29 / 14 days — activates on admin payment approve.
7. Auto MOM licence verify = **Phase B.2** (later).

Public: `/jobs`, `/jobs/[id]`, `/jobs/post`, `/jobs/mine`  
Admin: `/admin/jobs`

## Phase A — Housing (rooms) — shipped

1. Tables: `room_listings` + `room_listing_reports` (status: pending | published | rejected | expired).
2. User flow: login → `/housing/post` → admin approve → `/housing`.
3. Safety: no passport/FIN fields; report button; auto-hide at 3 reports; expire 45 days after publish; clear User-posted label.
4. Post quotas (DB): **2/day · 8/month · max 3 active** (pending+published). Daily cron sets `status=expired` when past `expires_at`.
5. Menu: Home shortcut + drawer Tools → Housing; Admin → Housing.
6. Income later: optional Featured listing — not in v1.

Public: `/housing`, `/housing/[id]`, `/housing/post`  
Admin: `/admin/housing`

## Order

Housing Phase A and Jobs Phase B.1 are shipped. Auto MOM licence verify remains Phase B.2.

## Not in scope for listings v1

Medical clinics directory, dorm government rules pages (those stay as Guide/news content).
