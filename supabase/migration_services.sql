-- ============================================
-- Strikil Lite - Migration: Tambah Jenis Jasa
--
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. TABEL SERVICES (jenis jasa)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kategori text not null check (kategori in ('kiloan', 'satuan')),
  satuan_label text not null default 'Kg',
  harga numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_services_kategori on public.services(kategori);

-- 2. ALTER TABEL ORDERS - tambah kolom service
alter table public.orders add column if not exists service_id uuid references public.services(id);
alter table public.orders add column if not exists service_nama text not null default '';
alter table public.orders add column if not exists jumlah numeric(10,2) not null default 0;
alter table public.orders add column if not exists satuan_label text not null default 'Kg';
alter table public.orders add column if not exists harga_satuan numeric(10,2) not null default 0;

-- 3. RLS untuk services
alter table public.services enable row level security;

drop policy if exists "services_all_authenticated" on public.services;
create policy "services_all_authenticated" on public.services
  for all to authenticated using (true) with check (true);

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select to anon, authenticated using (true);

-- 4. SEED DATA SERVICES
insert into public.services (nama, kategori, satuan_label, harga) values
  ('Setrika Reguler', 'kiloan', 'Kg', 7000),
  ('Setrika Express', 'kiloan', 'Kg', 10000),
  ('Setrika Super Express', 'kiloan', 'Kg', 15000),
  ('Cuci + Setrika', 'kiloan', 'Kg', 12000),
  ('Cuci Karpet', 'satuan', 'meter', 15000),
  ('Cuci Selimut', 'satuan', 'pcs', 20000),
  ('Cuci Jaket', 'satuan', 'pcs', 20000),
  ('Cuci Hoodie', 'satuan', 'pcs', 20000),
  ('Cuci Sweater', 'satuan', 'pcs', 20000),
  ('Cuci Tas', 'satuan', 'pcs', 25000),
  ('Cuci Sprei + Sarung Bantal & Guling', 'satuan', 'set', 25000),
  ('Cuci Handuk', 'satuan', 'pcs', 10000)
on conflict do nothing;

-- 5. UPDATE ORDER LAMA: set service_nama default untuk order yang belum punya service
update public.orders
set service_nama = 'Setrika Reguler',
    jumlah = berat,
    satuan_label = 'Kg',
    harga_satuan = harga_perkg
where service_id is null;

-- Verifikasi
select nama, kategori, satuan_label, harga from public.services order by kategori, nama;