-- Migration: Record why an item was rejected
--
-- Rejections are the clearest signal we have about what the research agent is
-- getting wrong. Without a reason attached, that signal is lost the moment the
-- admin clicks the button, and the agent repeats the mistake next week.

alter table public.content_items
  add column if not exists review_note text;

comment on column public.content_items.review_note is
  'Admin note explaining a rejection. Feeds back into the agent brief so the same mistake is not repeated.';
