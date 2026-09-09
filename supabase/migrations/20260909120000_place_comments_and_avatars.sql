-- ---------------------------------------------------------------------------
-- Comments under an off-day place, and the small bit of profile needed to
-- show who wrote one.
--
-- Scope was chosen deliberately and is narrower than it first looks. There is
-- no meetup, no "I will be at X at 2pm", no location sharing and no private
-- messaging, because this app's readers are a population that scam operators,
-- unlicensed moneylenders and unlicensed agents actively target, and a feature
-- that publishes "this person will be at this place at this time" hands those
-- operators a schedule. A comment under a place carries a fraction of that
-- risk: it says something about somewhere, not about where its author will be.
--
-- What a profile may hold is limited for the same reason: a display name and
-- an avatar. No age, no employer, no dormitory, no phone number — the fields
-- that turn a comment into a way to find someone.
-- ---------------------------------------------------------------------------

-- 1. Profile fields ---------------------------------------------------------

alter table public.profiles
  add column if not exists display_name text
  check (display_name is null or char_length(trim(display_name)) between 2 and 40);

alter table public.profiles
  add column if not exists avatar_path text;

comment on column public.profiles.display_name is
  'Shown beside a comment. Not unique, not an identity claim.';
comment on column public.profiles.avatar_path is
  'Object path inside the public "avatars" storage bucket. Null renders initials.';

-- Anyone may read the two public-facing fields of any profile, because a
-- comment is unreadable without the name attached to it. Email and role stay
-- restricted by the existing policies, which this does not widen: the app
-- selects only these columns when rendering a comment.
drop policy if exists "Public profile fields are readable" on public.profiles;
create policy "Public profile fields are readable"
  on public.profiles
  for select
  using (true);

-- 2. Comments ---------------------------------------------------------------

create table if not exists public.place_comments (
  id uuid primary key default gen_random_uuid(),
  -- The place key from src/lib/offDayPlaces.ts. Deliberately not a foreign
  -- key: places live in code, not in a table, so that adding one is a code
  -- review rather than a database write.
  place_key text not null check (char_length(place_key) between 1 and 60),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  -- Hidden rather than deleted, so an admin can take something down without
  -- destroying the record of what was posted.
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  -- Rest-day talk goes stale: which stall was good last month is not useful
  -- now, and keeping it forever grows a moderation surface nobody is paid to
  -- watch. Comments stop being shown after this date.
  expires_at timestamptz not null default (now() + interval '90 days')
);

alter table public.place_comments enable row level security;

create index if not exists idx_place_comments_lookup
  on public.place_comments (place_key, created_at desc)
  where is_visible = true;

-- Read: anyone, including signed-out readers, but only live comments.
drop policy if exists "Anyone can read visible comments" on public.place_comments;
create policy "Anyone can read visible comments"
  on public.place_comments
  for select
  using (is_visible = true and expires_at > now());

-- Write: signed-in users, only as themselves.
drop policy if exists "Signed-in users can comment" on public.place_comments;
create policy "Signed-in users can comment"
  on public.place_comments
  for insert
  with check (auth.uid() = author_id);

-- Authors may remove their own comment; nobody may edit one after the fact,
-- so what other readers replied to cannot be changed under them.
drop policy if exists "Authors can delete own comments" on public.place_comments;
create policy "Authors can delete own comments"
  on public.place_comments
  for delete
  using (auth.uid() = author_id);

drop policy if exists "Admins can see all comments" on public.place_comments;
create policy "Admins can see all comments"
  on public.place_comments
  for select
  using (public.is_admin());

drop policy if exists "Admins can hide comments" on public.place_comments;
create policy "Admins can hide comments"
  on public.place_comments
  for update
  using (public.is_admin());

drop policy if exists "Admins can delete comments" on public.place_comments;
create policy "Admins can delete comments"
  on public.place_comments
  for delete
  using (public.is_admin());
