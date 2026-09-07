-- ---------------------------------------------------------------------------
-- Which country an item is for.
--
-- Most of what we publish is Singapore law and applies to every reader: MOM
-- rules, transport, scams, health. Those rows keep `country` null, and null
-- means "everyone" rather than "unknown" — it is the normal case, not a gap.
--
-- A minority of items are tied to one nationality: a consular notice, a
-- home-country remittance requirement, a national holiday. Those name their
-- country, which lets us do two things we cannot do today:
--
--  1. Tell a reader at a glance that an item is not about them.
--  2. Measure coverage per country, so the daily agent can be held to a quota
--     instead of drifting back to whichever community it has the most sources
--     for. Without this column the quota is unmeasurable.
-- ---------------------------------------------------------------------------

alter table public.content_items
  add column if not exists country text
  check (country is null or country in ('mm', 'in', 'cn', 'bd', 'my'));

comment on column public.content_items.country is
  'Home country this item is specific to. Null means it applies to every reader.';

-- Coverage queries read published rows for one country over a recent window.
create index if not exists idx_content_items_country_published
  on public.content_items (country, published_at desc)
  where country is not null;
