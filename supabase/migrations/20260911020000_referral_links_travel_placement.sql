-- Allow travel partner links on the Travel (/travel) pages.

alter table public.referral_links
  drop constraint if exists referral_links_placement_check;

alter table public.referral_links
  add constraint referral_links_placement_check
  check (
    placement in (
      'bank',
      'paynow',
      'singpass',
      'grabpay',
      'page',
      'remittance',
      'travel'
    )
  );

comment on table public.referral_links is
  'Partner affiliate and invitation URLs for Accounts, Exchange remittance, and Travel placements.';
