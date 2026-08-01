-- ============================================
-- Strikil Lite - Migration: Sistem Pengantaran
--
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. ALTER TABEL CUSTOMERS - tambah ongkir default per pelanggan
alter table public.customers add column if not exists ongkir numeric(10,2) not null default 0;

-- 2. ALTER TABEL ORDERS - tambah pengantaran & ongkir
alter table public.orders add column if not exists pengantaran text not null default 'ditempat'
  check (pengantaran in ('ditempat', 'antar_jemput'));
alter table public.orders add column if not exists ongkir numeric(10,2) not null default 0;

-- 3. UPDATE ORDER LAMA: set pengantaran default
update public.orders set pengantaran = 'ditempat' where pengantaran is null or pengantaran = '';

-- Verifikasi
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name in ('customers', 'orders')
  and column_name in ('ongkir', 'pengantaran')
order by table_name, column_name;