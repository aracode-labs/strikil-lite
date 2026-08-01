/**
 * Test apakah halaman Progress bisa mengakses data orders tanpa login.
 * Jalankan: node scripts/test-progress.mjs
 */

import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectDir = join(__dirname, '..')

async function readEnv(key) {
  const envPath = join(projectDir, '.env')
  try {
    await access(envPath)
    const txt = await readFile(envPath, 'utf-8')
    const line = txt.split(/\r?\n/).find((l) => l.startsWith(key + '='))
    return line ? line.slice(key.length + 1).trim() : null
  } catch {
    return null
  }
}

async function main() {
  const url = await readEnv('VITE_SUPABASE_URL')
  const anonKey = await readEnv('VITE_SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    console.error('❌ Supabase URL/Key tidak ditemukan di .env')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, anonKey)

  // Test 1: Cek apakah anon bisa baca orders
  console.log('1. Test baca tabel orders (anon key)...')
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('nomor_order, status')
    .limit(5)

  if (ordersError) {
    console.log('   ❌ DITOLAK:', ordersError.message)
    console.log('   -> RLS policy publik belum dijalankan!')
    console.log('   -> Jalankan supabase/rls_public_progress.sql di Supabase SQL Editor')
  } else {
    console.log(`   ✅ Berhasil! Jumlah order: ${orders.length}`)
    if (orders.length > 0) {
      console.log('   Contoh nomor order:', orders.map((o) => o.nomor_order).join(', '))
    } else {
      console.log('   ⚠️  Tabel orders kosong - belum ada order dibuat')
    }
  }

  // Test 2: Cek apakah anon bisa baca customers
  console.log('')
  console.log('2. Test baca tabel customers (anon key)...')
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('nama, hp')
    .limit(3)

  if (customersError) {
    console.log('   ❌ DITOLAK:', customersError.message)
    console.log('   -> RLS policy customers_public_read belum dijalankan!')
  } else {
    console.log(`   ✅ Berhasil! Jumlah customer: ${customers.length}`)
  }

  // Test 3: Cek apakah anon bisa baca settings
  console.log('')
  console.log('3. Test baca tabel settings (anon key)...')
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (settingsError) {
    console.log('   ❌ DITOLAK:', settingsError.message)
  } else {
    console.log('   ✅ Berhasil! Nama toko:', settings.nama_toko)
  }

  // Test 4: Coba query dengan nomor order spesifik + join customers
  if (orders && orders.length > 0) {
    const testNomor = orders[0].nomor_order
    console.log('')
    console.log(`4. Test query order by nomor_order: ${testNomor}...`)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customers(nama, hp)')
      .eq('nomor_order', testNomor)
      .single()

    if (orderError) {
      console.log('   ❌ Error:', orderError.message)
    } else {
      console.log('   ✅ Berhasil! Customer:', order.customers?.nama)
      console.log('   URL progress:', `${url.replace('.supabase.co', '')}/progress/${testNomor}`)
    }
  }

  console.log('')
  if (ordersError || customersError) {
    console.log('📋 LANGKAH PERBAIKAN:')
    console.log('  1. Buka https://supabase.com/dashboard -> project Anda -> SQL Editor')
    console.log('  2. Paste isi file supabase/rls_public_progress.sql')
    console.log('  3. Klik RUN')
    console.log('  4. Jalankan lagi: node scripts/test-progress.mjs')
  } else {
    console.log('✅ Semua RLS policy publik sudah berfungsi!')
    console.log('   Halaman /progress/:nomorOrder seharusnya bisa diakses tanpa login.')
  }
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})