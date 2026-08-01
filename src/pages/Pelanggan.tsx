import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types'

export default function Pelanggan() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nama, setNama] = useState('')
  const [hp, setHp] = useState('')
  const [alamat, setAlamat] = useState('')
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('nama', { ascending: true })

    if (!error && data) {
      setCustomers(data as Customer[])
    }
    setLoading(false)
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.nama.toLowerCase().includes(q) || c.hp.toLowerCase().includes(q)
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) {
      setError('Nama wajib diisi')
      return
    }
    setSaving(true)
    setError('')

    const { error } = await supabase.from('customers').insert({
      nama: nama.trim(),
      hp: hp.trim(),
      alamat: alamat.trim(),
      catatan: catatan.trim(),
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setNama('')
    setHp('')
    setAlamat('')
    setCatatan('')
    setShowForm(false)
    loadCustomers()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Pelanggan</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? 'Tutup' : '+ Pelanggan Baru'}
        </button>
      </div>

      {/* Form tambah */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama *</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="Nama pelanggan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nomor HP</label>
            <input
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Alamat</label>
            <input
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="Alamat"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
            <input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="Catatan (opsional)"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'SIMPAN'}
          </button>
        </form>
      )}

      {/* Pencarian */}
      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
          placeholder="🔍 Cari nama / nomor HP"
        />
      </div>

      {/* Daftar */}
      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          {search ? 'Tidak ditemukan' : 'Belum ada pelanggan'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900">{c.nama}</p>
              <p className="text-sm text-gray-500">{c.hp || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}