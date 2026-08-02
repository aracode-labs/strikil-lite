-- ============================================
-- Strikil Lite - Migration: Deposit Pelanggan
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah kolom deposit ke customers (idempotent)
alter table public.customers add column if not exists deposit numeric(10,2) not null default 0;

-- Verifikasi
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'customers'
  and column_name = 'deposit'
order by ordinal_position;