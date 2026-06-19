insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'italian-builders-media',
  'italian-builders-media',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read Italian Builders media" on storage.objects;
create policy "Public can read Italian Builders media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'italian-builders-media');

drop policy if exists "Users can upload their own Italian Builders media" on storage.objects;
create policy "Users can upload their own Italian Builders media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'italian-builders-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own Italian Builders media" on storage.objects;
create policy "Users can update their own Italian Builders media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'italian-builders-media'
  and owner_id = auth.uid()::text
)
with check (
  bucket_id = 'italian-builders-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own Italian Builders media" on storage.objects;
create policy "Users can delete their own Italian Builders media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'italian-builders-media'
  and owner_id = auth.uid()::text
);
