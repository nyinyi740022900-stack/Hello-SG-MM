create extension if not exists "pgcrypto";

create table if not exists public.form_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  form_type text not null,
  draft_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, form_type)
);

alter table public.form_drafts enable row level security;

create policy "Users can view own drafts"
  on public.form_drafts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own drafts"
  on public.form_drafts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drafts"
  on public.form_drafts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.update_form_drafts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_form_drafts_updated_at on public.form_drafts;

create trigger set_form_drafts_updated_at
before update on public.form_drafts
for each row
execute function public.update_form_drafts_updated_at();
