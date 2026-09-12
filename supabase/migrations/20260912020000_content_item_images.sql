-- Optional cover image for news / events / directory content items.
-- Admin uploads only; public read via storage bucket.

alter table public.content_items
  add column if not exists image_path text;

comment on column public.content_items.image_path is
  'Object path inside the public content-images bucket. Null = text-only / category fallback.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read content images" on storage.objects;
create policy "Anyone can read content images"
on storage.objects for select
using (bucket_id = 'content-images');

drop policy if exists "Admins can upload content images" on storage.objects;
create policy "Admins can upload content images"
on storage.objects for insert
with check (
  bucket_id = 'content-images'
  and public.is_admin()
);

drop policy if exists "Admins can update content images" on storage.objects;
create policy "Admins can update content images"
on storage.objects for update
using (bucket_id = 'content-images' and public.is_admin())
with check (bucket_id = 'content-images' and public.is_admin());

drop policy if exists "Admins can delete content images" on storage.objects;
create policy "Admins can delete content images"
on storage.objects for delete
using (bucket_id = 'content-images' and public.is_admin());
