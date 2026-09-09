-- ---------------------------------------------------------------------------
-- Point a comment's author at `profiles`, not at `auth.users`.
--
-- Rendering a comment needs the author's display name and avatar, which live
-- on `profiles`. With the foreign key pointing into `auth.users` there was no
-- relationship for PostgREST to follow, so the embed failed outright:
--
--   PGRST200 — Could not find a relationship between 'place_comments'
--              and 'profiles' in the schema cache
--
-- `profiles.id` is itself `auth.users(id)` with `on delete cascade`, so this
-- keeps the same guarantee — a deleted account still takes its comments with
-- it — while giving the join something to resolve against.
-- ---------------------------------------------------------------------------

alter table public.place_comments
  drop constraint if exists place_comments_author_id_fkey;

alter table public.place_comments
  add constraint place_comments_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;
