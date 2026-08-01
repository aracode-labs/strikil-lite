/**
 * Verifikasi data pelanggan di Supabase.
 * Pakai anon key (RLS aktif) -> jika belum login, query akan ditolak.
 * Itu wajar dan menandakan RLS bekerja.
 *
 * Jalankan: node scripts/verify-customers.mjs
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

  const { data, error } = await supabase
    .from('customers')
    .select('id, nama, hp')
    .order('nama', { ascending: true })

  if (error) {
    console.log('⚠️  Query ditolak:', error.message)
    console.log('   Ini wajar jika RLS aktif dan Anda belum login via aplikasi.')
    console.log('   Data kemungkinan sudah masuk - cek via Supabase Dashboard -> Table Editor -> customers.')
    return
  }

  console.log(`✅ Jumlah pelanggan di database: ${data.length}`)
  console.log('')
  console.log('5 pelanggan pertama:')
  data.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.nama} — ${c.hp}`)
  })

  if (data.length > 5) {
    console.log(`  ... dan ${data.length - 5} lainnya.`)
  }
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})