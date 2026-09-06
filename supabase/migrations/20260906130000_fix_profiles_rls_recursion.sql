-- Migration: Fix infinite recursion in profiles RLS policies
--
-- Root cause: "Admins can view all profiles" and "Admins can update any
-- profile" (from 20260905_create_profiles_table.sql) check admin status by
-- running `exists (select 1 from public.profiles ...)` directly inside a
-- policy ON public.profiles. Postgres detects this self-reference and
-- raises "infinite recursion detected in policy for relation 'profiles'"
-- for EVERY query against profiles (not just admin ones), because RLS
-- policies are combined and evaluated together regardless of which policy
-- ends up matching.
--
-- This silently broke every role lookup app-wide: AuthStatus/AppNav's role
-- badge, AccountProfileCard, and — critically — checkAdminAuth() used by
-- the admin layout guard, which explains real admin accounts always being
-- treated as non-admin ("Access Denied" / normal-user experience).
--
-- Fix: use the existing public.is_admin() SECURITY DEFINER helper (added in
-- 20260905_add_is_admin_function.sql), which runs as its owner and bypasses
-- RLS for its own internal lookup, breaking the recursive loop.

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.is_admin());

create policy "Admins can update any profile"
  on public.profiles
  for update
  using (public.is_admin());

-- Also fix the same anti-pattern in news_items (introduced in the same
-- session, before this recursion bug was diagnosed) so it doesn't depend on
-- profiles' own policies being correct.
drop policy if exists "Admins can view all news" on public.news_items;
drop policy if exists "Admins can insert news" on public.news_items;
drop policy if exists "Admins can update news" on public.news_items;
drop policy if exists "Admins can delete news" on public.news_items;

create policy "Admins can view all news"
  on public.news_items
  for select
  using (public.is_admin());

create policy "Admins can insert news"
  on public.news_items
  for insert
  with check (public.is_admin());

create policy "Admins can update news"
  on public.news_items
  for update
  using (public.is_admin());

create policy "Admins can delete news"
  on public.news_items
  for delete
  using (public.is_admin());
