/**
 * Seed data pelanggan dari Pelanggan_Strikil_Kontak_Baju.csv
 *
 * Cara pakai:
 *  1) Generate SQL (default):
 *     node scripts/seed-customers.mjs --sql
 *     -> menghasilkan supabase/seed_customers.sql
 *     -> lalu copy-paste isinya ke Supabase SQL Editor
 *
 *  2) Langsung insert ke Supabase (butuh service role key):
 *     $env:SUPABASE_SERVICE_ROLE_KEY="..." ; node scripts/seed-customers.mjs --run
 *
 * Format nomor diubah dari "+62 896-3005-5445" menjadi "089630055445"
 * sesuai dengan format yang dipakai aplikasi (placeholder "08xxxxxxxxxx").
 */

import { readFile, writeFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectDir = join(__dirname, '..') // strikil-lite
const rootDir = join(projectDir, '..') // f:\Strikil
const csvPath = join(rootDir, 'Pelanggan_Strikil_Kontak_Baju.csv')
const sqlPath = join(projectDir, 'supabase', 'seed_customers.sql')

const args = process.argv.slice(2)

// ---------- Pembersih data ----------

function cleanName(raw) {
  return raw
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '') // hapus semua emoji
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '') // hapus karakter invisible
    .replace(/\s+/g, ' ') // normalisasi spasi ganda
    .replace(/\(\s+/g, '(') // "( xxx" -> "(xxx"
    .replace(/\s+\)/g, ')') // "xxx )" -> "xxx)"
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanPhone(raw) {
  let p = raw.trim()
  // "+62 896-3005-5445" -> "089630055445"
  if (p.startsWith('+62')) {
    p = '0' + p.slice(3)
  } else if (p.startsWith('+')) {
    p = '00' + p.slice(1)
  }
  p = p.replace(/[^\d]/g, '') // hapus semua non-digit
  return p
}

function escapeSql(s) {
  return s.replace(/'/g, "''")
}

// ---------- Baca & parse CSV ----------

async function readCustomers() {
  const raw = await readFile(csvPath, 'utf-8')
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const header = lines[0] // Nama,Telepon
  if (!header.includes('Telepon')) {
    throw new Error('Kolom "Telepon" tidak ditemukan di CSV')
  }
  const rows = lines.slice(1).map((line) => {
    const [nama, telepon] = line.split(',')
    return {
      nama: cleanName(nama || ''),
      hp: cleanPhone(telepon || ''),
    }
  }).filter((r) => r.nama && r.hp)
  return rows
}

// ---------- Generate SQL ----------

function generateSql(customers) {
  const values = customers
    .map((c) => `  ('${escapeSql(c.nama)}', '${c.hp}')`)
    .join(',\n')

  return `-- ============================================
-- Strikil Lite - Seed Data Pelanggan
-- Dihasilkan dari: Pelanggan_Strikil_Kontak_Baju.csv
-- Jumlah: ${customers.length} pelanggan
--
-- CARA PAKAI:
--  1. Buka Supabase Dashboard -> SQL Editor
--  2. Paste seluruh isi file ini
--  3. Klik RUN
-- ============================================

insert into public.customers (nama, hp) values
${values};

-- Tampilkan hasil:
select nama, hp from public.customers order by nama asc;
`
}

// ---------- Insert langsung via Supabase ----------

async function readEnv(envPath, key) {
  try {
    await access(envPath)
    const txt = await readFile(envPath, 'utf-8')
    const line = txt.split(/\r?\n/).find((l) => l.startsWith(key + '='))
    if (!line) return null
    return line.slice(key.length + 1).trim()
  } catch {
    return null
  }
}

async function runSeed(customers) {
  const supabaseUrl = await readEnv(join(projectDir, '.env'), 'VITE_SUPABASE_URL')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL tidak ditemukan di .env')
  }
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY belum di-set.\n' +
      'Ambil Service Role Key di Supabase Dashboard -> Settings -> API.\n' +
      'Lalu jalankan:\n  $env:SUPABASE_SERVICE_ROLE_KEY="..." ; node scripts/seed-customers.mjs --run'
    )
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data, error } = await supabase.from('customers').insert(customers).select('id, nama')
  if (error) {
    throw new Error('Gagal insert: ' + error.message)
  }
  console.log(`✅ ${data.length} pelanggan berhasil di-seed ke database.`)
  console.log('   Contoh:', data.slice(0, 3).map((r) => r.nama).join(', '))
}

// ---------- Main ----------

async function main() {
  const customers = await readCustomers()
  console.log(`📄 Membaca ${customers.length} pelanggan dari CSV...`)

  if (args.includes('--run')) {
    await runSeed(customers)
    return
  }

  // default: generate SQL
  const sql = generateSql(customers)
  await writeFile(sqlPath, sql, 'utf-8')
  console.log('✅ File SQL berhasil dibuat:', sqlPath)
  console.log('')
  console.log('Langkah berikutnya:')
  console.log('  1. Buka https://supabase.com/dashboard -> project Anda -> SQL Editor')
  console.log('  2. Paste isi file supabase/seed_customers.sql')
  console.log('  3. Klik RUN')
  console.log('')
  console.log('ATAU langsung insert dengan service role key:')
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="..." ; node scripts/seed-customers.mjs --run')
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})