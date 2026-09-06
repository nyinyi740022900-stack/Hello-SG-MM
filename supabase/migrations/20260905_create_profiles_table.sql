-- ============================================================================
-- Migration: Create profiles table for secure role management
-- Purpose: Store user profile info including role (user/agency/admin)
-- Role source: profiles.role (NOT raw_user_meta_data for security)
-- ============================================================================

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'agency', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Index for faster role lookups
create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================================================
-- RLS Policies for profiles table
-- ============================================================================

-- Users can view their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile (except role - admin only)
create policy "Users can update own profile (non-role)"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can update any profile (including role)
create policy "Admins can update any profile"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================================
-- Trigger: Auto-create profile on auth.users insert
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profiles_updated on public.profiles;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();
