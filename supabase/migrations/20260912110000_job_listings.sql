-- Phase B: Jobs board (agency-posted), applications + CV, messages, reports.
-- Featured boost uses payments.purpose = 'job_featured' + reference_id = job id.

create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  sector text not null,
  location_area text not null,
  salary_text text,
  contact text not null,
  mom_licence text,
  image_paths text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'published', 'rejected', 'expired')),
  admin_note text,
  report_count integer not null default 0 check (report_count >= 0),
  featured_until timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_listings_status_published_idx
  on public.job_listings (status, featured_until desc nulls last, published_at desc nulls last);

create index if not exists job_listings_poster_idx
  on public.job_listings (poster_id, created_at desc);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cover_note text not null,
  cv_path text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists job_applications_job_idx
  on public.job_applications (job_id, created_at desc);

create index if not exists job_applications_applicant_idx
  on public.job_applications (applicant_id, created_at desc);

create table if not exists public.job_listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.job_listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('scam', 'fee_upfront', 'inappropriate', 'spam', 'other')),
  details text,
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

create table if not exists public.job_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists job_messages_application_idx
  on public.job_messages (application_id, created_at asc);

create or replace function public.update_job_listings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_job_listings_updated_at on public.job_listings;
create trigger set_job_listings_updated_at
before update on public.job_listings
for each row execute function public.update_job_listings_updated_at();

create or replace function public.update_job_applications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_job_applications_updated_at on public.job_applications;
create trigger set_job_applications_updated_at
before update on public.job_applications
for each row execute function public.update_job_applications_updated_at();

create or replace function public.bump_job_listing_report_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_listings
  set
    report_count = report_count + 1,
    status = case
      when report_count + 1 >= 3 and status = 'published' then 'expired'
      else status
    end
  where id = new.listing_id;
  return new;
end;
$$;

drop trigger if exists on_job_listing_report on public.job_listing_reports;
create trigger on_job_listing_report
after insert on public.job_listing_reports
for each row execute function public.bump_job_listing_report_count();

alter table public.job_listings enable row level security;
alter table public.job_applications enable row level security;
alter table public.job_listing_reports enable row level security;
alter table public.job_messages enable row level security;

-- Listings
create policy "Anyone can read published job listings"
  on public.job_listings for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
  );

create policy "Posters can read own job listings"
  on public.job_listings for select
  to authenticated
  using (poster_id = auth.uid());

create policy "Admins can read all job listings"
  on public.job_listings for select
  using (public.is_admin());

create policy "Agency or admin can insert pending jobs"
  on public.job_listings for insert
  to authenticated
  with check (
    poster_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('agency', 'admin')
    )
  );

create policy "Admins can update job listings"
  on public.job_listings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete job listings"
  on public.job_listings for delete
  using (public.is_admin());

-- Applications
create policy "Applicants can insert own applications"
  on public.job_applications for insert
  to authenticated
  with check (applicant_id = auth.uid());

create policy "Applicants can read own applications"
  on public.job_applications for select
  to authenticated
  using (applicant_id = auth.uid());

create policy "Posters can read applications for own jobs"
  on public.job_applications for select
  to authenticated
  using (
    exists (
      select 1 from public.job_listings j
      where j.id = job_id and j.poster_id = auth.uid()
    )
  );

create policy "Posters can update applications for own jobs"
  on public.job_applications for update
  to authenticated
  using (
    exists (
      select 1 from public.job_listings j
      where j.id = job_id and j.poster_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.job_listings j
      where j.id = job_id and j.poster_id = auth.uid()
    )
  );

create policy "Admins can manage job applications"
  on public.job_applications for all
  using (public.is_admin())
  with check (public.is_admin());

-- Reports
create policy "Users can report job listings"
  on public.job_listing_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Admins can read job listing reports"
  on public.job_listing_reports for select
  using (public.is_admin());

-- Messages: parties on the application only
create policy "Application parties can read messages"
  on public.job_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications a
      join public.job_listings j on j.id = a.job_id
      where a.id = application_id
        and (a.applicant_id = auth.uid() or j.poster_id = auth.uid())
    )
    or public.is_admin()
  );

create policy "Application parties can insert messages"
  on public.job_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.job_applications a
      join public.job_listings j on j.id = a.job_id
      where a.id = application_id
        and (a.applicant_id = auth.uid() or j.poster_id = auth.uid())
    )
  );

comment on table public.job_listings is
  'Agency/admin posted job listings. Moderated. Separate from news work category.';

-- Public job photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-images',
  'job-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can read job images"
on storage.objects for select
using (bucket_id = 'job-images');

create policy "Users can upload own job images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'job-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own job images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'job-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can manage job images"
on storage.objects for all
using (bucket_id = 'job-images' and public.is_admin())
with check (bucket_id = 'job-images' and public.is_admin());

-- Private CVs — no public read; signed URLs via service role API
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-cvs',
  'job-cvs',
  false,
  2097152,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload own job cvs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'job-cvs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own job cvs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'job-cvs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can manage job cvs"
on storage.objects for all
using (bucket_id = 'job-cvs' and public.is_admin())
with check (bucket_id = 'job-cvs' and public.is_admin());
