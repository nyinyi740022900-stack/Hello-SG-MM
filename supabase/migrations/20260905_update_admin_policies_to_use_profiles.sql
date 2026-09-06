-- ============================================================================
-- Migration: Update all admin RLS policies to use profiles.role
-- Purpose: Replace raw_user_meta_data checks with secure profiles.role checks
-- IMPORTANT: Run AFTER 20260905_create_profiles_table.sql and 
--            20260905_add_is_admin_function.sql
-- ============================================================================

-- ============================================================================
-- 1. PAYMENTS TABLE POLICIES
-- ============================================================================

-- Drop old payment policies (from 20260905_add_admin_payment_review_policy.sql)
drop policy if exists "Admins can view all payments" on public.payments;
drop policy if exists "Admins can update payments" on public.payments;

-- Recreate with profiles.role check
create policy "Admins can view all payments"
  on public.payments
  for select
  using (public.is_admin());

create policy "Admins can update payments"
  on public.payments
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 2. STORAGE: PAYMENT RECEIPTS BUCKET POLICIES
-- ============================================================================

-- Drop old admin storage policy (from 20260905_create_payment_receipts_bucket.sql)
drop policy if exists "Admins can read all payment receipts" on storage.objects;

-- Recreate with profiles.role check
create policy "Admins can read all payment receipts"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and public.is_admin()
  );

-- ============================================================================
-- 3. AD_EVENTS TABLE POLICIES
-- ============================================================================

-- Drop old ad_events policy (from 20260905_create_ads_and_sponsor_tables.sql)
drop policy if exists "Admins can select all ad events" on public.ad_events;

-- Recreate with profiles.role check
create policy "Admins can select all ad events"
  on public.ad_events
  for select
  using (public.is_admin());

-- ============================================================================
-- 4. SPONSOR_INQUIRIES TABLE POLICIES
-- ============================================================================

-- Drop old sponsor_inquiries policies (from 20260905_create_ads_and_sponsor_tables.sql)
drop policy if exists "Admins can select all sponsor inquiries" on public.sponsor_inquiries;
drop policy if exists "Admins can update sponsor inquiries" on public.sponsor_inquiries;

-- Recreate with profiles.role check
create policy "Admins can select all sponsor inquiries"
  on public.sponsor_inquiries
  for select
  using (public.is_admin());

create policy "Admins can update sponsor inquiries"
  on public.sponsor_inquiries
  for update
  using (public.is_admin());

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- After running this migration:
-- 1. Admin checks now use profiles.role instead of raw_user_meta_data
-- 2. Existing admin users need a row in profiles with role='admin'
-- 3. Use this SQL to promote a user to admin:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- ============================================================================
