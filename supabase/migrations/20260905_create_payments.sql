create extension if not exists "pgcrypto";

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('stripe', 'kpay', 'wavepay', 'manual')),
  amount numeric not null,
  currency text not null default 'USD',
  purpose text not null,
  reference_id text,
  receipt_path text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  admin_note text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments
  for select
  using (auth.uid() = user_id);

create policy "Users can submit own payments"
  on public.payments
  for insert
  with check (auth.uid() = user_id);

create or replace function public.update_payments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_payments_updated_at on public.payments;

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.update_payments_updated_at();
