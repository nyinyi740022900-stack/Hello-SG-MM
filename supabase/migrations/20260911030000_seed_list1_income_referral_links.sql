-- Seed List 1 income starter links (official URLs).
-- Replace each url with your tracked affiliate/invitation link when approved.
-- Idempotent: skips rows that already exist for the same partner_name + placement.

insert into public.referral_links (
  title,
  description,
  url,
  link_type,
  placement,
  cta_label,
  partner_name,
  is_active,
  sort_order
)
select *
from (
  values
    (
      'Remitly — send money home',
      'Licensed remittance. Replace URL with your Remitly affiliate link, then set type to Affiliate.',
      'https://www.remitly.com/sg/en',
      'invitation',
      'remittance',
      'Open Remitly',
      'Remitly',
      true,
      0
    ),
    (
      'WorldRemit — international transfer',
      'Remittance option. Replace URL with your WorldRemit affiliate link, then set type to Affiliate.',
      'https://www.worldremit.com/en/singapore',
      'invitation',
      'remittance',
      'Open WorldRemit',
      'WorldRemit',
      true,
      1
    ),
    (
      'Agoda — book hotels',
      'Hotels for nearby trips. Replace URL with your Agoda affiliate link, then set type to Affiliate.',
      'https://www.agoda.com/',
      'invitation',
      'travel',
      'Open Agoda',
      'Agoda',
      true,
      0
    ),
    (
      'Trip.com — hotels & flights',
      'Hotels and flights. Replace URL with your Trip.com affiliate link, then set type to Affiliate.',
      'https://www.trip.com/',
      'invitation',
      'travel',
      'Open Trip.com',
      'Trip.com',
      true,
      1
    ),
    (
      'Airalo — travel eSIM',
      'Travel eSIM. Replace URL with your Airalo affiliate link, then set type to Affiliate.',
      'https://www.airalo.com/',
      'invitation',
      'travel',
      'Get eSIM',
      'Airalo',
      true,
      2
    ),
    (
      'YouTrip — multi-currency card',
      'Travel card. Replace URL with your YouTrip referral link, then set type to Affiliate.',
      'https://www.you.co/sg/youtrip/',
      'invitation',
      'travel',
      'Open YouTrip',
      'YouTrip',
      true,
      3
    ),
    (
      'Revolut — account signup',
      'Optional account. Replace URL with your Revolut affiliate link, then set type to Affiliate.',
      'https://www.revolut.com/en-SG/',
      'invitation',
      'bank',
      'Open Revolut',
      'Revolut',
      true,
      10
    ),
    (
      'OCBC FRANK — bank account',
      'Open FRANK yourself first, then paste your personal referral link (MGM).',
      'https://www.ocbc.com/personal-banking/cards/frank-debit-card',
      'invitation',
      'bank',
      'Open OCBC FRANK',
      'OCBC FRANK',
      true,
      0
    )
) as v(
  title,
  description,
  url,
  link_type,
  placement,
  cta_label,
  partner_name,
  is_active,
  sort_order
)
where not exists (
  select 1
  from public.referral_links r
  where r.partner_name = v.partner_name
    and r.placement = v.placement
);
