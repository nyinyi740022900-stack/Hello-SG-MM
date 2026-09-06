-- Migration: translation storage and the reporting loop that makes it safe
--
-- The portal now offers six languages, but only English and Myanmar have been
-- read by anyone who speaks them. For the other four there is currently no one
-- in the loop who would notice a mistranslation — and the failure mode that
-- matters is not awkward phrasing, it is fluent, confident and wrong: a dropped
-- negation in "do not pay an agent fee" reads perfectly well and inverts the
-- advice.
--
-- Two pieces here:
--   1. somewhere to put machine translations, so they can be stored and
--      labelled rather than rendered inline and passed off as authored text
--   2. a way for readers to report a bad one, which is the only route we have
--      to native-speaker signal in languages nobody on this side reads

alter table public.content_items
  add column if not exists translations jsonb not null default '{}'::jsonb;

comment on column public.content_items.translations is
  'Machine translations keyed by locale, e.g. {"ta": {"title": "...", "summary": "...", "body": "..."}}. Always displayed with a machine-translation label. High-risk categories are deliberately left empty — see TRANSLATABLE_CATEGORIES in src/lib/translation.ts.';

-- ---------------------------------------------------------------------------
-- Reader-reported translation problems
-- ---------------------------------------------------------------------------

create table if not exists public.translation_reports (
  id uuid primary key default gen_random_uuid(),
  -- Which language the reader was reading when it looked wrong.
  locale text not null,
  -- Where they were. Free text: this must work from any page.
  page_path text not null,
  -- Set when the report is about a specific article.
  content_item_id uuid references public.content_items(id) on delete set null,
  -- What looked wrong, in the reader's own words. Optional: a report with no
  -- note is still a signal that something on that page reads badly.
  note text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'fixed', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.translation_reports enable row level security;

drop policy if exists "Anyone can report a translation problem" on public.translation_reports;
drop policy if exists "Admins can view translation reports" on public.translation_reports;
drop policy if exists "Admins can update translation reports" on public.translation_reports;

-- Reporting has to work without an account: the readers most likely to spot a
-- bad translation are the least likely to have signed up. The API route rate
-- limits by IP, and nothing here is readable by the public.
create policy "Anyone can report a translation problem"
  on public.translation_reports
  for insert
  with check (true);

create policy "Admins can view translation reports"
  on public.translation_reports
  for select
  using (public.is_admin());

create policy "Admins can update translation reports"
  on public.translation_reports
  for update
  using (public.is_admin());

create index if not exists idx_translation_reports_open
  on public.translation_reports (status, created_at desc);
