-- ---------------------------------------------------------------------------
-- Narrow the rate-provider check constraint to what the app can actually
-- write: 'bank', 'market', 'other'.
--
-- The original constraint allowed 'kbzpay' and 'wavepay' from when the rates
-- page linked to those apps as places to "check the live rate". Neither
-- publishes a rate close to what people actually transact at, and no daily,
-- verifiable source exists for either, so both names were removed from the
-- product entirely — the TypeScript RateProvider type no longer accepts
-- them. Zero rows have ever used either value (verified before writing this
-- migration), so narrowing the constraint changes nothing about existing
-- data; it only stops a value the application layer can no longer produce
-- from being possible at the database layer either.
-- ---------------------------------------------------------------------------

alter table public.exchange_rates
  drop constraint if exists exchange_rates_provider_check;

alter table public.exchange_rates
  add constraint exchange_rates_provider_check
  check (provider in ('bank', 'market', 'other'));
