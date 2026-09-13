-- One level of threaded replies on place comments, matching the pattern
-- already used by page_comments. Replies are ordinary rows with parent_id
-- set; the API layer (not a DB constraint) rejects a reply-to-a-reply, the
-- same way page_comments keeps threading to one level.
alter table public.place_comments
  add column if not exists parent_id uuid references public.place_comments(id) on delete cascade;

alter table public.place_comments
  add constraint place_comments_no_self_parent check (parent_id is distinct from id);

create index if not exists idx_place_comments_parent
  on public.place_comments (parent_id, created_at asc)
  where is_visible = true and parent_id is not null;
