-- Migration: Expand the news feed into a portal content model
--
-- Phase 2 of the portal rebuild. `news_items` held one kind of thing; the
-- portal also needs events and a service directory. Rather than three tables
-- with three review queues, everything reviewable lives in one `content_items`
-- table with a `type` discriminator, so the admin approves from a single list.
--
-- Exchange rates are deliberately NOT part of that queue: approving a number
-- daily is friction with no editorial value, and a stale rate is worse than a
-- clearly-labelled indicative one. They get their own auto-published table
-- which the admin can hide or correct.

-- ---------------------------------------------------------------------------
-- 1. news_items -> content_items
-- ---------------------------------------------------------------------------

alter table public.news_items rename to content_items;

-- ---------------------------------------------------------------------------
-- 2. New columns
-- ---------------------------------------------------------------------------

alter table public.content_items
  -- what kind of thing this is
  add column if not exists type text not null default 'news',
  -- 'urgent' takes over the top of the homepage; use sparingly
  add column if not exists priority text not null default 'normal',
  -- shareable, SEO-friendly URL segment
  add column if not exists slug text,
  -- one-line card text; body stays the full detail-page text
  add column if not exists summary_en text,
  add column if not exists summary_my text,
  -- display "MOM" rather than a raw URL
  add column if not exists source_name text,
  -- the date the SOURCE published, not the date we found it
  add column if not exists source_published_at date,
  -- time-limited items (expired advisories, past events) self-hide
  add column if not exists expires_at timestamptz,
  add column if not exists tags text[] not null default '{}',
  -- type = 'event'
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists location_name text,
  add column if not exists address text,
  -- type = 'directory'
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists opening_hours text,
  add column if not exists languages text[],
  add column if not exists is_free boolean;

alter table public.content_items
  drop constraint if exists content_items_type_check;
alter table public.content_items
  add constraint content_items_type_check
  check (type in ('news', 'event', 'directory'));

alter table public.content_items
  drop constraint if exists content_items_priority_check;
alter table public.content_items
  add constraint content_items_priority_check
  check (priority in ('urgent', 'high', 'normal'));

-- ---------------------------------------------------------------------------
-- 3. Category taxonomy: 4 -> 8
-- ---------------------------------------------------------------------------

-- The old constraint travelled with the rename under its original name.
alter table public.content_items
  drop constraint if exists news_items_category_check;
alter table public.content_items
  drop constraint if exists content_items_category_check;

-- 'exchange_rate' widens into 'finance' (remittance, fees, wallets, banks).
update public.content_items set category = 'finance' where category = 'exchange_rate';

alter table public.content_items
  add constraint content_items_category_check
  check (category in (
    'mom_policy',   -- work permits, S Pass, levies, rest days
    'embassy',      -- passport renewal, consular services
    'safety_scam',  -- scams, loan sharks, deceptive agents
    'finance',      -- remittance channels, fees, the 25% rule
    'legal',        -- TADM salary claims, injury compensation
    'health',       -- clinics, insurance, mental health
    'community',    -- events, gatherings, embassy notices
    'education'     -- training, language, free courses
  ));

-- ---------------------------------------------------------------------------
-- 4. Backfill slugs for existing rows
-- ---------------------------------------------------------------------------

-- New rows get their slug from the application layer. This only needs to cover
-- what is already here: lowercase the English title, keep [a-z0-9], collapse
-- separators, trim to 60 chars, then append a short id suffix for uniqueness.
update public.content_items
set slug = trim(both '-' from left(
      regexp_replace(lower(coalesce(title_en, 'item')), '[^a-z0-9]+', '-', 'g'),
      60
    )) || '-' || left(replace(id::text, '-', ''), 6)
where slug is null;

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------

-- Dedupe: the research agent physically cannot post the same source twice.
-- Rejected rows keep their claim on the URL, so a rejected story is not
-- silently resubmitted later.
create unique index if not exists uniq_content_items_source_url
  on public.content_items (source_url)
  where source_url is not null;

create unique index if not exists uniq_content_items_slug
  on public.content_items (slug)
  where slug is not null;

-- Feed query: published items, urgent first, newest first.
create index if not exists idx_content_items_feed
  on public.content_items (status, published_at desc);

create index if not exists idx_content_items_type_status
  on public.content_items (type, status, published_at desc);

create index if not exists idx_content_items_category
  on public.content_items (category);

-- Upcoming events.
create index if not exists idx_content_items_starts_at
  on public.content_items (starts_at)
  where type = 'event';

-- Old index names travelled with the rename; drop the redundant ones.
drop index if exists idx_news_items_status_published_at;
drop index if exists idx_news_items_category;

-- ---------------------------------------------------------------------------
-- 6. updated_at trigger (renamed to match the table)
-- ---------------------------------------------------------------------------

create or replace function public.update_content_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_news_items_updated_at on public.content_items;
drop trigger if exists set_content_items_updated_at on public.content_items;

create trigger set_content_items_updated_at
before update on public.content_items
for each row
execute function public.update_content_items_updated_at();

drop function if exists public.update_news_items_updated_at();

-- ---------------------------------------------------------------------------
-- 7. RLS policies
-- ---------------------------------------------------------------------------
-- Admin checks go through public.is_admin(), which is SECURITY DEFINER. A
-- policy that queries profiles inline caused infinite recursion here before —
-- do not reintroduce that pattern.

alter table public.content_items enable row level security;

drop policy if exists "Anyone can view published news" on public.content_items;
drop policy if exists "Admins can view all news" on public.content_items;
drop policy if exists "Admins can insert news" on public.content_items;
drop policy if exists "Admins can update news" on public.content_items;
drop policy if exists "Admins can delete news" on public.content_items;

-- Public feed: published, and not past its expiry.
create policy "Anyone can view live content"
  on public.content_items
  for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
  );

-- Admins see everything, including pending and expired.
create policy "Admins can view all content"
  on public.content_items
  for select
  using (public.is_admin());

create policy "Admins can insert content"
  on public.content_items
  for insert
  with check (public.is_admin());

create policy "Admins can update content"
  on public.content_items
  for update
  using (public.is_admin());

create policy "Admins can delete content"
  on public.content_items
  for delete
  using (public.is_admin());

-- The agent submission route uses the service role key, which bypasses RLS,
-- so agent inserts need no anon/authenticated policy.

-- ---------------------------------------------------------------------------
-- 8. exchange_rates — auto-published, outside the review queue
-- ---------------------------------------------------------------------------

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  pair text not null default 'SGD_MMK',
  provider text not null check (provider in ('kbzpay', 'wavepay', 'bank', 'market', 'other')),
  -- how many units of the quote currency per 1 unit of the base
  rate numeric(14, 4) not null check (rate > 0),
  source_url text,
  source_name text,
  -- when the rate was actually observed at the source, not when we stored it
  observed_at timestamptz not null,
  note_en text,
  note_my text,
  -- admin kill switch for a rate that turns out to be wrong
  is_visible boolean not null default true,
  created_by text not null default 'agent',
  created_at timestamptz not null default now()
);

alter table public.exchange_rates enable row level security;

drop policy if exists "Anyone can view visible rates" on public.exchange_rates;
drop policy if exists "Admins can view all rates" on public.exchange_rates;
drop policy if exists "Admins can insert rates" on public.exchange_rates;
drop policy if exists "Admins can update rates" on public.exchange_rates;
drop policy if exists "Admins can delete rates" on public.exchange_rates;

create policy "Anyone can view visible rates"
  on public.exchange_rates
  for select
  using (is_visible = true);

create policy "Admins can view all rates"
  on public.exchange_rates
  for select
  using (public.is_admin());

create policy "Admins can insert rates"
  on public.exchange_rates
  for insert
  with check (public.is_admin());

create policy "Admins can update rates"
  on public.exchange_rates
  for update
  using (public.is_admin());

create policy "Admins can delete rates"
  on public.exchange_rates
  for delete
  using (public.is_admin());

-- Latest rate per provider.
create index if not exists idx_exchange_rates_lookup
  on public.exchange_rates (pair, provider, observed_at desc);

-- One reading per provider per observation time.
create unique index if not exists uniq_exchange_rates_observation
  on public.exchange_rates (pair, provider, observed_at);
