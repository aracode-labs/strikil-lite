-- ============================================
-- Strikil Lite - Migration: Tambah Tabel Services
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Buat tabel services (idempotent)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kategori text not null check (kategori in ('kiloan', 'satuan')),
  satuan_label text not null default 'Kg',
  harga numeric(10,2) not null default 0,
  created_at timestamp with time zone default now()
);

-- Index untuk performa
create index if not exists idx_services_kategori on public.services(kategori);

-- RLS: public read, authenticated write
alter table public.services enable row level security;

create policy "Public Read Services"
on public.services for select
using (true);

create policy "Authenticated Write Services"
on public.services for insert
with check (auth.role() = 'authenticated');

create policy "Authenticated Update Services"
on public.services for update
using (auth.role() = 'authenticated');

create policy "Authenticated Delete Services"
on public.services for delete
using (auth.role() = 'authenticated');

-- Seed data default
insert into public.services (nama, kategori, satuan_label, harga)
values
  ('Setrika Reguler', 'kiloan', 'Kg', 5000),
  ('Setrika Kilat', 'kiloan', 'Kg', 7000),
  ('Setrika Express', 'kiloan', 'Kg', 10000)
on conflict do nothing;

insert into public.services (nama, kategori, satuan_label, harga)
values
  ('Cuci Kemeja', 'satuan', 'pcs', 15000),
  ('Cuci Celana', 'satuan', 'pcs', 12000),
  ('Cuci Jas', 'satuan', 'pcs', 25000),
  ('Cuci Gaun', 'satuan', 'pcs', 35000)
on conflict do nothing;

-- Foreign key dari orders ke services (idempotent)
-- Catatan: kolom service_id sudah ada di tabel orders (migration_orders_service.sql)
-- Tambahkan FK jika belum ada
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'orders'
      and constraint_name = 'orders_service_id_fkey'
  ) then
    alter table public.orders
    add constraint orders_service_id_fkey
    foreign key (service_id) references public.services(id)
    on delete set null;
  end if;
end $$;