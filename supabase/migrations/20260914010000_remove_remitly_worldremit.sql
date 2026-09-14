-- Remove Remitly and WorldRemit from the remittance referral links.
-- Remitly's public URL only leads to a personal "invite friends" referral
-- program (capped at 20 referrals, requires the account owner's own first
-- transfer first) rather than a website/publisher affiliate program.
-- WorldRemit's app is not available for download in the Singapore region,
-- making it useless to this app's readers regardless of affiliate terms.
delete from public.referral_links
where partner_name in ('Remitly', 'WorldRemit')
  and placement = 'remittance';
