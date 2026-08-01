/**
 * Test apakah tabel services ada dan punya data.
 * Jalankan: node scripts/test-services.mjs
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

  console.log('Test baca tabel services (anon key)...')
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('kategori', { ascending: true })
    .order('nama', { ascending: true })

  if (error) {
    console.log('❌ ERROR:', error.message)
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('')
      console.log('📋 TABEL SERVICES BELUM DIBUAT!')
      console.log('   Jalankan supabase/migration_services.sql di Supabase SQL Editor')
    } else if (error.message.includes('permission') || error.message.includes('policy')) {
      console.log('')
      console.log('📋 RLS POLICY BELUM DIJALANKAN!')
      console.log('   Jalankan supabase/migration_services.sql di Supabase SQL Editor')
    }
  } else {
    console.log(`✅ Berhasil! Jumlah services: ${data.length}`)
    if (data.length > 0) {
      console.log('')
      data.forEach((s) => {
        console.log(`  ${s.kategori === 'kiloan' ? '📦' : '🧺'} ${s.nama} - Rp ${s.harga}/${s.satuan_label}`)
      })
    } else {
      console.log('⚠️  Tabel services kosong - seed data belum dijalankan')
    }
  }

  console.log('')
  if (error || !data || data.length === 0) {
    console.log('📋 LANGKAH PERBAIKAN:')
    console.log('  1. Buka https://supabase.com/dashboard -> project Anda -> SQL Editor')
    console.log('  2. Paste isi file supabase/migration_services.sql')
    console.log('  3. Klik RUN')
    console.log('  4. Jalankan lagi: node scripts/test-services.mjs')
  } else {
    console.log('✅ Tabel services sudah berfungsi!')
    console.log('   Jenis jasa seharusnya bisa dipilih di halaman Order Baru.')
  }
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})