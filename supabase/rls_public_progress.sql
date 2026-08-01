-- ============================================
-- Strikil Lite - RLS Policy untuk Halaman Progress Publik
--
-- Jalankan di Supabase SQL Editor agar halaman /progress/:nomorOrder
-- bisa diakses tanpa login (customer melacak order)
--
-- CARA PAKAI:
--  1. Buka Supabase Dashboard -> SQL Editor
--  2. Paste seluruh isi file ini
--  3. Klik RUN
-- ============================================

-- Policy: orders bisa dibaca publik (anon) - read only
-- Hanya SELECT, tidak bisa INSERT/UPDATE/DELETE
create policy "orders_public_read"
  on public.orders
  for select
  to anon, authenticated
  using (true);

-- Policy: settings bisa dibaca publik (anon) - read only
-- Untuk menampilkan info toko (nama, alamat, no_hp) di halaman Progress
create policy "settings_public_read"
  on public.settings
  for select
  to anon, authenticated
  using (true);

-- Verifikasi: cek policy yang aktif
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'settings')
order by tablename, policyname;