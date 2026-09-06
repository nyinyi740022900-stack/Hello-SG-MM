-- ============================================================================
-- Migration: Harden profile role security + entitlement policy alignment
-- Purpose:
--   1) Prevent users from escalating their own role in profiles table.
--   2) Ensure signup profile trigger always assigns safe default role 'user'.
--   3) Align export_entitlements admin policies to profiles-based is_admin().
--   4) Add atomic entitlement consumption function for secure export flow.
-- ============================================================================

-- 1) Enforce role immutability for non-admin users
create or replace function public.prevent_profile_role_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profiles_prevent_role_escalation on public.profiles;

create trigger on_profiles_prevent_role_escalation
before update on public.profiles
for each row
execute function public.prevent_profile_role_escalation();

-- 2) Safe default role on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 3) Switch entitlement admin policies to profiles-based helper
drop policy if exists "Admin can insert entitlements" on public.export_entitlements;
drop policy if exists "Admin can update entitlements" on public.export_entitlements;

create policy "Admin can insert entitlements"
  on public.export_entitlements
  for insert
  with check (public.is_admin());

create policy "Admin can update entitlements"
  on public.export_entitlements
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 4) Atomic entitlement consumption for export flow
create or replace function public.consume_export_entitlement(
  p_user_id uuid,
  p_product_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized to consume this entitlement.';
  end if;

  update public.export_entitlements
  set used_exports = used_exports + 1,
      updated_at = now()
  where id = (
    select id
    from public.export_entitlements
    where user_id = p_user_id
      and product_code = p_product_code
      and (expires_at is null or expires_at > now())
      and used_exports < total_exports
    order by created_at asc
    limit 1
    for update skip locked
  )
  returning id into v_entitlement_id;

  return v_entitlement_id;
end;
$$;

revoke all on function public.consume_export_entitlement(uuid, text) from public;
grant execute on function public.consume_export_entitlement(uuid, text) to authenticated;
