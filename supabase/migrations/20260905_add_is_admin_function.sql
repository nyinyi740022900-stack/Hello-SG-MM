-- ============================================================================
-- Migration: Create helper function for admin role check
-- Purpose: Reusable function to check if current user is admin via profiles.role
-- ============================================================================

-- Helper function to check if current user is admin (from profiles table)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- Grant execute permission to authenticated users
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is 
  'Returns true if the authenticated user has admin role in profiles table. 
   Use this in RLS policies instead of checking raw_user_meta_data.';
