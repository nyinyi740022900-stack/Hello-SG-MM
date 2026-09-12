-- Collapse news categories from 12 → 6 for a simpler home/news filter rail.
--
-- Mapping:
--   work      ← mom_policy, jobs, education, embassy
--   money     ← finance, cost_of_living, exchange_rate (legacy)
--   safety    ← safety_scam, legal
--   health    ← health
--   housing   ← housing  (kept for news + future room listings entry)
--   community ← community, transport
--
-- Existing published rows are remapped so filters keep working.

alter table public.content_items
  drop constraint if exists content_items_category_check;

-- Widen temporarily so UPDATEs can land on new values while old values still exist.
alter table public.content_items
  add constraint content_items_category_check
  check (category in (
    'mom_policy',
    'embassy',
    'safety_scam',
    'finance',
    'legal',
    'health',
    'community',
    'education',
    'transport',
    'jobs',
    'housing',
    'cost_of_living',
    'exchange_rate',
    'work',
    'money',
    'safety'
  ));

update public.content_items
set category = case category
  when 'mom_policy' then 'work'
  when 'jobs' then 'work'
  when 'education' then 'work'
  when 'embassy' then 'work'
  when 'finance' then 'money'
  when 'cost_of_living' then 'money'
  when 'exchange_rate' then 'money'
  when 'safety_scam' then 'safety'
  when 'legal' then 'safety'
  when 'transport' then 'community'
  else category
end
where category in (
  'mom_policy',
  'jobs',
  'education',
  'embassy',
  'finance',
  'cost_of_living',
  'exchange_rate',
  'safety_scam',
  'legal',
  'transport'
);

alter table public.content_items
  drop constraint if exists content_items_category_check;

alter table public.content_items
  add constraint content_items_category_check
  check (category in (
    'work',       -- work passes, jobs (official), training, consular
    'money',      -- remittance, banks, cost of living / vouchers
    'safety',     -- scams + rights / legal claims
    'health',     -- clinics, insurance, haze health
    'housing',    -- rent / dorm news (future: room listing board)
    'community'   -- events, gatherings, transport notices
  ));
