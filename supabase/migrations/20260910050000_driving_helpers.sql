-- Community helpers who offer free Myanmar-language driving licence support.
-- Shown on the public /driving-license page; managed from Admin → Helpers.

create table if not exists public.driving_helpers (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_my text not null,
  description_en text,
  description_my text,
  -- Object path inside the public "helper-images" bucket
  image_path text,
  facebook_url text,
  telegram_url text,
  whatsapp_url text,
  group_url text,
  website_url text,
  is_free boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists driving_helpers_active_sort_idx
  on public.driving_helpers (is_active, sort_order);

alter table public.driving_helpers enable row level security;

create policy "Anyone can select active driving helpers"
  on public.driving_helpers
  for select
  using (is_active = true);

create policy "Admins can select all driving helpers"
  on public.driving_helpers
  for select
  using (public.is_admin());

create policy "Admins can insert driving helpers"
  on public.driving_helpers
  for insert
  with check (public.is_admin());

create policy "Admins can update driving helpers"
  on public.driving_helpers
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete driving helpers"
  on public.driving_helpers
  for delete
  using (public.is_admin());

comment on table public.driving_helpers is
  'Admin-managed free Myanmar driving-licence helpers with social/group links and optional image.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'helper-images',
  'helper-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read helper images" on storage.objects;
create policy "Anyone can read helper images"
on storage.objects
for select
using (bucket_id = 'helper-images');

drop policy if exists "Admins can upload helper images" on storage.objects;
create policy "Admins can upload helper images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'helper-images'
  and public.is_admin()
);

drop policy if exists "Admins can update helper images" on storage.objects;
create policy "Admins can update helper images"
on storage.objects
for update
to authenticated
using (bucket_id = 'helper-images' and public.is_admin())
with check (bucket_id = 'helper-images' and public.is_admin());

drop policy if exists "Admins can delete helper images" on storage.objects;
create policy "Admins can delete helper images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'helper-images' and public.is_admin());
