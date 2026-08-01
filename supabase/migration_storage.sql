-- ============================================
-- Strikil Lite - Migration: Setup Storage Bucket
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Buat bucket photos (public)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- RLS policies untuk bucket photos
-- Policy: Public read access
create policy "Public Read Photos"
on storage.objects for select
using (bucket_id = 'photos');

-- Policy: Authenticated upload
create policy "Authenticated Upload Photos"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and auth.role() = 'authenticated'
);

-- Policy: Authenticated delete (opsional, untuk hapus foto lama)
create policy "Authenticated Delete Photos"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and auth.role() = 'authenticated'
);

-- Verifikasi
select id, name, public, created_at
from storage.buckets
where id = 'photos';