-- Allow remittance partner links on the Exchange (/rates) page.

alter table public.referral_links
  drop constraint if exists referral_links_placement_check;

alter table public.referral_links
  add constraint referral_links_placement_check
  check (
    placement in ('bank', 'paynow', 'singpass', 'grabpay', 'page', 'remittance')
  );

comment on table public.referral_links is
  'Partner affiliate and invitation URLs for Accounts Guide and Exchange remittance placements.';
