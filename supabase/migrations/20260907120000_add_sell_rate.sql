-- ---------------------------------------------------------------------------
-- Money changers quote two sides, and the difference is the reader's money.
--
-- A worker in Singapore sending SGD home cares about the BUY side: the changer
-- buys their Singapore dollars and pays out kyat. The sell side is what they
-- would pay to get Singapore dollars back. Quoting one number without saying
-- which side it is invites someone to plan around the wrong one.
--
-- `rate` is therefore the buy side — what the reader receives per 1 SGD — and
-- keeps its existing meaning for every row already stored. `rate_sell` is
-- optional: feed-derived mid-market readings have no two sides and leave it
-- null, while an observed money-changer reading fills both.
-- ---------------------------------------------------------------------------

alter table public.exchange_rates
  add column if not exists rate_sell numeric(14, 4)
  check (rate_sell is null or rate_sell > 0);

comment on column public.exchange_rates.rate is
  'Buy side: units of the quote currency the reader receives per 1 SGD.';

comment on column public.exchange_rates.rate_sell is
  'Sell side, where the source quotes two. Null for mid-market feed readings.';
