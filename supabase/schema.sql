-- ============================================
-- Strikil Lite - Database Schema
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. TABEL CUSTOMERS
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  hp text not null default '',
  alamat text not null default '',
  catatan text not null default '',
  created_at timestamptz not null default now()
);

-- 2. TABEL ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  nomor_order text not null unique,
  customer_id uuid not null references public.customers(id) on delete cascade,
  berat numeric(10,2) not null,
  harga_perkg numeric(10,2) not null,
  total numeric(10,2) not null,
  status text not null default 'Diterima' check (status in ('Diterima', 'Diproses', 'Siap Diambil', 'Selesai')),
  catatan text not null default '',
  estimasi_selesai text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- 3. TABEL SETTINGS (hanya 1 baris)
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  nama_toko text not null default 'Strikil',
  alamat text not null default '',
  no_hp text not null default '',
  harga_perkg numeric(10,2) not null default 7000,
  minimum_kg numeric(10,2) not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Isi settings default jika kosong
insert into public.settings (id, nama_toko, alamat, no_hp, harga_perkg, minimum_kg)
values (1, 'Strikil', '', '', 7000, 2)
on conflict (id) do nothing;

-- 4. TRIGGER NOMOR ORDER OTOMATIS
-- Format: SK + YYMMDD + 3 digit urutan  ->  SK250801001
create or replace function public.generate_nomor_order()
returns trigger
language plpgsql
as $$
declare
  date_part text;
  seq int;
begin
  date_part := to_char(now(), 'YYMMDD');
  select count(*) + 1 into seq
  from public.orders
  where nomor_order like 'SK' || date_part || '%';

  new.nomor_order := 'SK' || date_part || lpad(seq::text, 3, '0');
  return new;
end;
$$;

create or replace trigger trg_generate_nomor_order
  before insert on public.orders
  for each row
  when (new.nomor_order is null or new.nomor_order = '')
  execute function public.generate_nomor_order();

-- 5. RLS (Row Level Security)
-- Aplikasi internal: hanya user yang login yang bisa mengakses semua data.

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;

create policy "customers_all_authenticated" on public.customers
  for all to authenticated using (true) with check (true);

create policy "orders_all_authenticated" on public.orders
  for all to authenticated using (true) with check (true);

create policy "settings_all_authenticated" on public.settings
  for all to authenticated using (true) with check (true);

-- 6. RLS PUBLIK (untuk halaman Progress - tanpa login)
-- Customer bisa melihat detail order berdasarkan nomor_order (read-only)
create policy "orders_public_read" on public.orders
  for select to anon, authenticated using (true);

-- Settings bisa dibaca publik (untuk info toko di halaman Progress)
create policy "settings_public_read" on public.settings
  for select to anon, authenticated using (true);

-- Customers bisa dibaca publik (untuk join nama/HP di halaman Progress)
create policy "customers_public_read" on public.customers
  for select to anon, authenticated using (true);
