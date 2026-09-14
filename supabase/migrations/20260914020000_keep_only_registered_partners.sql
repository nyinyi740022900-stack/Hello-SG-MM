-- Keep only the partners actually registered so far (Trip.com, Airalo,
-- Circles.Life). Agoda, YouTrip, Revolut and OCBC FRANK were starter
-- placeholders never actually applied for — drop them rather than show a
-- link nobody has signed up to earn from yet.
delete from public.referral_links
where partner_name in ('Agoda', 'YouTrip', 'Revolut', 'OCBC FRANK');
