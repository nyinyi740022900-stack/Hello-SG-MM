insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own payment receipts" on storage.objects;
create policy "Users can upload own payment receipts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own payment receipts" on storage.objects;
create policy "Users can read own payment receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins can read all payment receipts" on storage.objects;
create policy "Admins can read all payment receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and exists (
    select 1
    from auth.users
    where auth.users.id = auth.uid()
      and coalesce(auth.users.raw_user_meta_data ->> 'role', '') = 'admin'
  )
);
