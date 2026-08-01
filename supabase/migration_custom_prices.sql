-- ============================================
-- Strikil Lite - Migration: Tarif Custom per Pelanggan
--
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Tabel customer_service_prices: override harga per pelanggan per jasa
create table if not exists public.customer_service_prices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  harga_custom numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_service_unique unique (customer_id, service_id)
);

create index if not exists idx_csp_customer on public.customer_service_prices(customer_id);
create index if not exists idx_csp_service on public.customer_service_prices(service_id);

-- RLS
alter table public.customer_service_prices enable row level security;

drop policy if exists "csp_all_authenticated" on public.customer_service_prices;
create policy "csp_all_authenticated" on public.customer_service_prices
  for all to authenticated using (true) with check (true);

-- Trigger untuk updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_csp_updated_at on public.customer_service_prices;
create trigger trg_csp_updated_at
  before update on public.customer_service_prices
  for each row execute function public.update_updated_at();

-- Verifikasi
select table_name, column_name, data_type 
from information_schema.columns 
where table_schema = 'public' and table_name = 'customer_service_prices'
order by ordinal_position;