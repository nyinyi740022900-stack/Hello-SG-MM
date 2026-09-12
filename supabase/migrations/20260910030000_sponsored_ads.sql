-- Sponsored ad creatives managed by admin (image, title, details, link).
-- Shown on public placements such as home_bottom and guide_bottom.

create table if not exists public.sponsored_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sponsor_name text not null default 'Partner',
  cta_label text not null default 'Learn More',
  target_url text not null,
  -- Object path inside the public "ad-images" bucket (nullable = text-only ad)
  image_path text,
  placement text not null check (
    placement in ('home_bottom', 'guide_bottom', 'home_top')
  ),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsored_ads_date_window check (
    starts_at is null or ends_at is null or ends_at >= starts_at
  )
);

create index if not exists sponsored_ads_active_placement_idx
  on public.sponsored_ads (is_active, placement, sort_order);

alter table public.sponsored_ads enable row level security;

-- Public can read currently active ads (for home/guide banners)
create policy "Anyone can select active sponsored ads"
  on public.sponsored_ads
  for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Admins can select all sponsored ads"
  on public.sponsored_ads
  for select
  using (public.is_admin());

create policy "Admins can insert sponsored ads"
  on public.sponsored_ads
  for insert
  with check (public.is_admin());

create policy "Admins can update sponsored ads"
  on public.sponsored_ads
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete sponsored ads"
  on public.sponsored_ads
  for delete
  using (public.is_admin());

comment on table public.sponsored_ads is
  'Admin-managed sponsored banners with optional image, shown on public placements.';

-- Public image bucket for ad creatives
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-images',
  'ad-images',
  true,
  3145728, -- 3 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read ad images" on storage.objects;
create policy "Anyone can read ad images"
on storage.objects
for select
using (bucket_id = 'ad-images');

drop policy if exists "Admins can upload ad images" on storage.objects;
create policy "Admins can upload ad images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ad-images'
  and public.is_admin()
);

drop policy if exists "Admins can update ad images" on storage.objects;
create policy "Admins can update ad images"
on storage.objects
for update
to authenticated
using (bucket_id = 'ad-images' and public.is_admin())
with check (bucket_id = 'ad-images' and public.is_admin());

drop policy if exists "Admins can delete ad images" on storage.objects;
create policy "Admins can delete ad images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'ad-images' and public.is_admin());
