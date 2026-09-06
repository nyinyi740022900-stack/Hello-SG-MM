create policy "Admins can view all payments"
  on public.payments
  for select
  using (
    exists (
      select 1
      from auth.users
      where auth.users.id = auth.uid()
        and coalesce(auth.users.raw_user_meta_data ->> 'role', '') = 'admin'
    )
  );

create policy "Admins can update payments"
  on public.payments
  for update
  using (
    exists (
      select 1
      from auth.users
      where auth.users.id = auth.uid()
        and coalesce(auth.users.raw_user_meta_data ->> 'role', '') = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from auth.users
      where auth.users.id = auth.uid()
        and coalesce(auth.users.raw_user_meta_data ->> 'role', '') = 'admin'
    )
  );
