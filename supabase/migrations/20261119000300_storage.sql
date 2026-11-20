-- New Life Global — Supabase Storage bucket + policies
-- Public read (website images), staff-only writes, size and MIME restrictions enforced by Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml',
              'video/mp4','video/webm','audio/mpeg','audio/mp4','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());

create policy "media editor update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (public.can_edit_content() or owner = auth.uid()))
  with check (bucket_id = 'media' and (public.can_edit_content() or owner = auth.uid()));

create policy "media editor delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (public.can_edit_content() or owner = auth.uid()));
