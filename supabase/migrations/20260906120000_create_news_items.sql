-- Migration: Create news_items table for the daily update/news feed
-- Purpose: Hold bilingual news items relevant to Myanmar migrant workers in
-- Singapore (MOM/embassy policy changes, exchange rates, scam alerts,
-- community news). Items can come from an admin (published immediately) or
-- from the automated daily research agent (status starts as 'pending' and
-- requires admin approval before it becomes visible to users).

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('mom_policy', 'exchange_rate', 'safety_scam', 'community')),
  title_en text not null,
  title_my text not null,
  body_en text not null,
  body_my text not null,
  source_url text,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_by text not null default 'admin', -- 'admin' or 'agent'
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_items enable row level security;

-- Anyone (including anonymous visitors) can read published items only.
create policy "Anyone can view published news"
  on public.news_items
  for select
  using (status = 'published');

-- Admins can view all items regardless of status.
create policy "Admins can view all news"
  on public.news_items
  for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Admins can insert/update/delete news items via the dashboard.
create policy "Admins can insert news"
  on public.news_items
  for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can update news"
  on public.news_items
  for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Admins can delete news"
  on public.news_items
  for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- The automated agent submission route uses the Supabase service role key
-- (bypasses RLS entirely), so no anon/authenticated insert policy is needed
-- for agent-created rows.

create or replace function public.update_news_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_news_items_updated_at on public.news_items;

create trigger set_news_items_updated_at
before update on public.news_items
for each row
execute function public.update_news_items_updated_at();

create index if not exists idx_news_items_status_published_at
  on public.news_items (status, published_at desc);

create index if not exists idx_news_items_category
  on public.news_items (category);
