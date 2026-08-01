-- ============================================
-- Strikil Lite - Migration: Tambah Kolom Service ke Orders
--
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah kolom service ke orders (idempotent)
alter table public.orders add column if not exists service_id uuid references public.services(id);
alter table public.orders add column if not exists service_nama text not null default '';
alter table public.orders add column if not exists jumlah numeric(10,2) not null default 0;
alter table public.orders add column if not exists satuan_label text not null default 'Kg';
alter table public.orders add column if not exists harga_satuan numeric(10,2) not null default 0;

-- Tambah kolom pengantaran & ongkir (idempotent)
alter table public.orders add column if not exists pengantaran text not null default 'ditempat'
  check (pengantaran in ('ditempat', 'antar_jemput'));
alter table public.orders add column if not exists ongkir numeric(10,2) not null default 0;

-- Update order lama yang belum punya service_nama
update public.orders
set service_nama = 'Setrika Reguler',
    jumlah = berat,
    satuan_label = 'Kg',
    harga_satuan = harga_perkg
where service_id is null;

-- Verifikasi
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('service_id', 'service_nama', 'jumlah', 'satuan_label', 'harga_satuan', 'pengantaran', 'ongkir')
order by ordinal_position;