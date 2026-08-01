-- ============================================
-- Strikil Lite - Migration: Foto Penimbangan
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah kolom foto penimbangan ke orders (idempotent)
alter table public.orders add column if not exists foto_penimbangan_url text;

-- Verifikasi
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('foto_penimbangan_url')
order by ordinal_position;