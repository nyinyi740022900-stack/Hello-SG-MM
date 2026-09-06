-- Migration: Create salary_entries table for the salary/deduction evidence log
-- Purpose: Let workers self-record expected vs received salary each pay cycle so they
-- have an organised, exportable record if they ever need to file a TADM salary claim.
-- Evidence: salary theft is the highest-volume documented complaint category for
-- migrant workers in Singapore (see 07-additional-features-analysis.md, Section 1.2).
-- Free feature: logging entries. Premium feature: PDF export (gated via export_entitlements).

create table if not exists public.salary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  expected_amount numeric(10, 2) not null check (expected_amount >= 0),
  received_amount numeric(10, 2) not null check (received_amount >= 0),
  currency text not null default 'SGD',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.salary_entries enable row level security;

create policy "Users can view own salary entries"
  on public.salary_entries
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own salary entries"
  on public.salary_entries
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own salary entries"
  on public.salary_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own salary entries"
  on public.salary_entries
  for delete
  using (auth.uid() = user_id);

create or replace function public.update_salary_entries_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_salary_entries_updated_at on public.salary_entries;

create trigger set_salary_entries_updated_at
before update on public.salary_entries
for each row
execute function public.update_salary_entries_updated_at();

create index if not exists idx_salary_entries_user_date
  on public.salary_entries (user_id, entry_date desc);
