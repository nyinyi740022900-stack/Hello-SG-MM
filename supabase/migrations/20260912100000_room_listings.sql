-- Phase A: user-posted room listings (moderated board, separate from news).

create table if not exists public.room_listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  area text not null,
  price_sgd numeric(10, 2) not null check (price_sgd > 0),
  contact text not null,
  image_paths text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'published', 'rejected', 'expired')),
  admin_note text,
  report_count integer not null default 0 check (report_count >= 0),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists room_listings_status_published_idx
  on public.room_listings (status, published_at desc nulls last);

create index if not exists room_listings_poster_idx
  on public.room_listings (poster_id, created_at desc);

create table if not exists public.room_listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.room_listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('scam', 'inappropriate', 'spam', 'other')),
  details text,
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

create index if not exists room_listing_reports_listing_idx
  on public.room_listing_reports (listing_id);

create or replace function public.update_room_listings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_room_listings_updated_at on public.room_listings;
create trigger set_room_listings_updated_at
before update on public.room_listings
for each row
execute function public.update_room_listings_updated_at();

-- After enough unique reports, hide the listing automatically.
create or replace function public.bump_room_listing_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.room_listings
  set
    report_count = report_count + 1,
    status = case
      when report_count + 1 >= 3 and status = 'published' then 'expired'
      else status
    end
  where id = new.listing_id
  returning report_count into new_count;

  return new;
end;
$$;

drop trigger if exists on_room_listing_report on public.room_listing_reports;
create trigger on_room_listing_report
after insert on public.room_listing_reports
for each row
execute function public.bump_room_listing_report_count();

alter table public.room_listings enable row level security;
alter table public.room_listing_reports enable row level security;

drop policy if exists "Anyone can read published room listings" on public.room_listings;
create policy "Anyone can read published room listings"
  on public.room_listings for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
  );

drop policy if exists "Posters can read own room listings" on public.room_listings;
create policy "Posters can read own room listings"
  on public.room_listings for select
  to authenticated
  using (poster_id = auth.uid());

drop policy if exists "Admins can read all room listings" on public.room_listings;
create policy "Admins can read all room listings"
  on public.room_listings for select
  using (public.is_admin());

drop policy if exists "Users can insert own pending room listings" on public.room_listings;
create policy "Users can insert own pending room listings"
  on public.room_listings for insert
  to authenticated
  with check (
    poster_id = auth.uid()
    and status = 'pending'
  );

drop policy if exists "Admins can update room listings" on public.room_listings;
create policy "Admins can update room listings"
  on public.room_listings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete room listings" on public.room_listings;
create policy "Admins can delete room listings"
  on public.room_listings for delete
  using (public.is_admin());

drop policy if exists "Users can report room listings" on public.room_listing_reports;
create policy "Users can report room listings"
  on public.room_listing_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "Admins can read room listing reports" on public.room_listing_reports;
create policy "Admins can read room listing reports"
  on public.room_listing_reports for select
  using (public.is_admin());

comment on table public.room_listings is
  'User-posted room/dorm listings. Pending until admin approves. Separate from news housing category.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-images',
  'room-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read room images" on storage.objects;
create policy "Anyone can read room images"
on storage.objects for select
using (bucket_id = 'room-images');

drop policy if exists "Users can upload own room images" on storage.objects;
create policy "Users can upload own room images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'room-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own room images" on storage.objects;
create policy "Users can delete own room images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'room-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins can manage room images" on storage.objects;
create policy "Admins can manage room images"
on storage.objects for all
using (bucket_id = 'room-images' and public.is_admin())
with check (bucket_id = 'room-images' and public.is_admin());
