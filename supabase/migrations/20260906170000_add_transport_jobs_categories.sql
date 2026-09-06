-- Migration: Add transport and jobs categories
--
-- The portal is widening from Myanmar-worker-specific news into utilities that
-- serve anyone living in Singapore. Two of those need their own topic:
--
--   transport — MRT/bus disruptions, planned closures, fare changes
--   jobs      — hiring notices and job fairs, from OFFICIAL sources only
--
-- Weather, haze (PSI) and UV deliberately get no category here: they are live
-- readings pulled straight from NEA's public API at request time, not editorial
-- items, so they never enter the review queue or this table.

alter table public.content_items
  drop constraint if exists content_items_category_check;

alter table public.content_items
  add constraint content_items_category_check
  check (category in (
    'mom_policy',   -- work permits, S Pass, levies, rest days
    'embassy',      -- passport renewal, consular services
    'safety_scam',  -- scams, loan sharks, deceptive agents
    'finance',      -- remittance channels, fees, the 25% rule
    'legal',        -- TADM salary claims, injury compensation
    'health',       -- clinics, insurance, mental health
    'community',    -- events, gatherings, embassy notices
    'education',    -- training, language, free courses
    'transport',    -- MRT/bus disruptions, closures, fare changes
    'jobs'          -- hiring notices and job fairs from official sources
  ));
