-- Admin-managed partner referral / invitation links shown on Accounts Guide.
-- Two kinds:
--   affiliate  = bank / remittance / wallet signup that can earn commission
--   invitation = sponsor form / WhatsApp invite that can bring ad partners

create table if not exists public.referral_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  link_type text not null check (link_type in ('affiliate', 'invitation')),
  -- Which account card this sits under on /accounts-guide
  placement text not null check (
    placement in ('bank', 'paynow', 'singpass', 'grabpay', 'page')
  ),
  cta_label text not null default 'Open link',
  partner_name text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists referral_links_active_placement_idx
  on public.referral_links (is_active, placement, sort_order);

alter table public.referral_links enable row level security;

-- Public can read active links only (Accounts Guide is public)
create policy "Anyone can select active referral links"
  on public.referral_links
  for select
  using (is_active = true);

-- Admins can see all rows (including inactive) via is_admin()
create policy "Admins can select all referral links"
  on public.referral_links
  for select
  using (public.is_admin());

create policy "Admins can insert referral links"
  on public.referral_links
  for insert
  with check (public.is_admin());

create policy "Admins can update referral links"
  on public.referral_links
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete referral links"
  on public.referral_links
  for delete
  using (public.is_admin());

comment on table public.referral_links is
  'Partner affiliate and invitation URLs managed by admin for Accounts Guide income.';
