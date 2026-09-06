-- Ad Events table for tracking impressions and clicks
create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  placement text not null,
  event_type text not null check (event_type in ('impression', 'click')),
  target_url text,
  created_at timestamptz not null default now()
);

-- Sponsor Inquiries table for businesses interested in advertising
create table if not exists public.sponsor_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.ad_events enable row level security;
alter table public.sponsor_inquiries enable row level security;

-- Ad Events Policies
-- Anyone (authenticated or anonymous) can insert ad events
create policy "Anyone can insert ad events"
  on public.ad_events
  for insert
  with check (true);

-- Only admins can select all ad events (for analytics)
create policy "Admins can select all ad events"
  on public.ad_events
  for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Sponsor Inquiries Policies
-- Anyone (authenticated or anonymous) can submit sponsor inquiries
create policy "Anyone can insert sponsor inquiries"
  on public.sponsor_inquiries
  for insert
  with check (true);

-- Only admins can view all sponsor inquiries
create policy "Admins can select all sponsor inquiries"
  on public.sponsor_inquiries
  for select
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Only admins can update sponsor inquiry status
create policy "Admins can update sponsor inquiries"
  on public.sponsor_inquiries
  for update
  using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
      and (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );
