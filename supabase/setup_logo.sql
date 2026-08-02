-- ============================================
-- Strikil Lite - Setup Logo di Supabase Storage
-- Jalankan di Supabase SQL Editor SEKALI SAJA
-- ============================================

-- Pastikan bucket photos ada (public)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Pastikan policy untuk upload foto penimbangan sudah ada
-- (sudah dibuat di migration_storage.sql)

-- Verifikasi bucket
select id, name, public
from storage.buckets
where id = 'photos';