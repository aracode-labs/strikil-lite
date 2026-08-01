-- ============================================
-- Strikil Lite - Migration: Metode & Status Pembayaran
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tambah kolom pembayaran ke orders (idempotent)
alter table public.orders add column if not exists metode_pembayaran text not null default 'cash'
  check (metode_pembayaran in ('cash', 'qris', 'transfer'));

alter table public.orders add column if not exists status_pembayaran text not null default 'belum_bayar'
  check (status_pembayaran in ('belum_bayar', 'dp', 'lunas'));

-- Update order lama yang belum punya metode_pembayaran
update public.orders
set metode_pembayaran = 'cash',
    status_pembayaran = 'belum_bayar'
where metode_pembayaran is null;

-- Verifikasi
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('metode_pembayaran', 'status_pembayaran')
order by ordinal_position;