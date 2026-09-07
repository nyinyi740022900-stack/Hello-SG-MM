-- Migration: add housing and cost_of_living categories
--
-- Hello SG now serves anyone who has to understand Singapore in a second
-- language, not only workers on a permit. Two things that audience deals with
-- constantly had nowhere to go:
--
--   housing         — renting a room or flat, tenancy rights and deposits,
--                     HDB/URA rules on subletting, dormitory standards,
--                     utilities. Housing is where a newcomer is most often
--                     overcharged or misled, and almost none of the guidance
--                     exists outside English.
--   cost_of_living  — GST and GST Vouchers, CDC vouchers, utility rebates,
--                     transport concessions, subsidy schemes and who qualifies.
--                     Eligibility is the whole story here: many schemes are for
--                     citizens and PRs only, and saying so plainly stops people
--                     wasting a rest day queueing for something they cannot get.
--
-- Existing rows are unaffected: this only widens the allowed set.

alter table public.content_items
  drop constraint if exists content_items_category_check;

alter table public.content_items
  add constraint content_items_category_check
  check (category in (
    'mom_policy',      -- work passes, levies, rest days, ICA and CPF matters
    'embassy',         -- consular services across the five missions
    'safety_scam',     -- scams, loan sharks, deceptive agents
    'finance',         -- remittance channels, fees, home-country rules
    'legal',           -- TADM salary claims, injury compensation
    'health',          -- clinics, insurance, mental health
    'community',       -- events, gatherings, community notices
    'education',       -- training, language, free courses
    'transport',       -- MRT/bus disruptions, closures, fare changes
    'jobs',            -- hiring notices and job fairs from official sources
    'housing',         -- renting, tenancy rights, dormitories, utilities
    'cost_of_living'   -- GST, vouchers, rebates, subsidies and who qualifies
  ));
