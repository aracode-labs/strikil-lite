-- ============================================
-- Strikil Lite - Migration: Fix Foreign Key Services
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Drop constraint lama jika ada (untuk menghindari error duplicate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND constraint_name = 'orders_service_id_fkey'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_service_id_fkey;
  END IF;
END $$;

-- Buat ulang constraint dengan ON DELETE SET NULL
ALTER TABLE public.orders
ADD CONSTRAINT orders_service_id_fkey
FOREIGN KEY (service_id) REFERENCES public.services(id)
ON DELETE SET NULL;

-- Verifikasi
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_service_id_fkey';