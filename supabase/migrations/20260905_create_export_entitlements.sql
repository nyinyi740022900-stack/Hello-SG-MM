-- Migration: Create export_entitlements table for premium feature unlocks
-- Purpose: Track user entitlements for PDF export and other premium features

create table if not exists public.export_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null,
  total_exports int not null default 1,
  used_exports int not null default 0,
  expires_at timestamptz,
  source_payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Prevent duplicate entitlements for same payment
  constraint export_entitlements_unique_payment unique (user_id, product_code, source_payment_id),

  -- Ensure used_exports never exceeds total_exports
  constraint export_entitlements_used_lte_total check (used_exports <= total_exports),

  -- Ensure counts are non-negative
  constraint export_entitlements_positive_counts check (total_exports >= 0 and used_exports >= 0)
);

-- Enable Row Level Security
alter table public.export_entitlements enable row level security;

-- Policy: Users can view their own entitlements
create policy "Users can view own entitlements"
  on public.export_entitlements
  for select
  using (auth.uid() = user_id);

-- Policy: Admin can insert entitlements (checked via profiles.role)
-- Note: This requires a profiles table with a role column, or uses user_metadata
create policy "Admin can insert entitlements"
  on public.export_entitlements
  for insert
  with check (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admin can update entitlements
create policy "Admin can update entitlements"
  on public.export_entitlements
  for update
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Service role can also manage entitlements (for API routes using service key)
-- This is handled by Supabase automatically when using service_role key

-- Auto-update updated_at trigger
create or replace function public.update_export_entitlements_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_export_entitlements_updated_at on public.export_entitlements;

create trigger set_export_entitlements_updated_at
before update on public.export_entitlements
for each row
execute function public.update_export_entitlements_updated_at();

-- Create index for faster lookups by user and product
create index if not exists idx_export_entitlements_user_product
  on public.export_entitlements (user_id, product_code);

-- Create index for expiry checks
create index if not exists idx_export_entitlements_expires
  on public.export_entitlements (expires_at)
  where expires_at is not null;
