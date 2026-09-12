-- Page-level Q&A comments (guides/tools) with one-level replies and reports.
-- Places under off-day-guide keep using place_comments; this is per page_key.

create table if not exists public.page_comments (
  id uuid primary key default gen_random_uuid(),
  -- Stable key from app code (e.g. lottery, rest-day-rights). Not a FK.
  page_key text not null check (char_length(page_key) between 1 and 80),
  author_id uuid not null references public.profiles(id) on delete cascade,
  -- Null = top-level question/comment; set = reply to that parent (one level only).
  parent_id uuid references public.page_comments(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 800),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  constraint page_comments_no_self_parent check (parent_id is distinct from id)
);

create index if not exists idx_page_comments_page
  on public.page_comments (page_key, created_at desc)
  where is_visible = true;

create index if not exists idx_page_comments_parent
  on public.page_comments (parent_id, created_at asc)
  where is_visible = true and parent_id is not null;

alter table public.page_comments enable row level security;

drop policy if exists "Anyone can read visible page comments" on public.page_comments;
create policy "Anyone can read visible page comments"
  on public.page_comments
  for select
  using (is_visible = true);

drop policy if exists "Signed-in users can post page comments" on public.page_comments;
create policy "Signed-in users can post page comments"
  on public.page_comments
  for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors can delete own page comments" on public.page_comments;
create policy "Authors can delete own page comments"
  on public.page_comments
  for delete
  using (auth.uid() = author_id);

drop policy if exists "Admins can select all page comments" on public.page_comments;
create policy "Admins can select all page comments"
  on public.page_comments
  for select
  using (public.is_admin());

drop policy if exists "Admins can update page comments" on public.page_comments;
create policy "Admins can update page comments"
  on public.page_comments
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete page comments" on public.page_comments;
create policy "Admins can delete page comments"
  on public.page_comments
  for delete
  using (public.is_admin());

comment on table public.page_comments is
  'Q&A under guide/tool pages. One-level replies via parent_id. Soft-hide with is_visible.';

-- Reports against a comment (hate / inappropriate / spam)
create table if not exists public.page_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.page_comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (
    reason in ('hate', 'inappropriate', 'spam', 'other')
  ),
  details text check (details is null or char_length(trim(details)) <= 400),
  status text not null default 'pending' check (
    status in ('pending', 'dismissed', 'resolved')
  ),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create index if not exists idx_page_comment_reports_pending
  on public.page_comment_reports (status, created_at desc);

alter table public.page_comment_reports enable row level security;

drop policy if exists "Signed-in users can report page comments" on public.page_comment_reports;
create policy "Signed-in users can report page comments"
  on public.page_comment_reports
  for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Admins can select page comment reports" on public.page_comment_reports;
create policy "Admins can select page comment reports"
  on public.page_comment_reports
  for select
  using (public.is_admin());

drop policy if exists "Admins can update page comment reports" on public.page_comment_reports;
create policy "Admins can update page comment reports"
  on public.page_comment_reports
  for update
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.page_comment_reports is
  'User reports on page comments for admin moderation.';
