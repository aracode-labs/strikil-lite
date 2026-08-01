import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer, Settings } from '../types'

export default function OrderBaru() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [berat, setBerat] = useState('')
  const [catatan, setCatatan] = useState('')
  const [estimasi, setEstimasi] = useState('')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadCustomers()
    loadSettings()
  }, [])

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('nama', { ascending: true })

    if (!error && data) {
      setCustomers(data as Customer[])
    }
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (!error && data) {
      setSettings(data as Settings)
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.nama.toLowerCase().includes(q) || c.hp.toLowerCase().includes(q)
  })

  const beratNum = parseFloat(berat) || 0
  const hargaPerKg = settings?.harga_perkg ?? 0
  const total = beratNum * hargaPerKg

  const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected) {
      setError('Pilih pelanggan dulu')
      return
    }
    if (beratNum <= 0) {
      setError('Isi berat cucian')
      return
    }
    setSaving(true)
    setError('')

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: selected.id,
        berat: beratNum,
        harga_perkg: hargaPerKg,
        total,
        status: 'Diterima',
        catatan: catatan.trim(),
        estimasi_selesai: estimasi.trim(),
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    // Pindah ke halaman e-struk dengan id order
    navigate(`/e-struk/${data.id}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Order Baru</h2>

      {/* Pilih pelanggan */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700">Cari Pelanggan</label>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelected(null)
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
          placeholder="🔍 Cari nama / nomor HP"
        />

        {!selected && search && (
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-2 text-sm text-gray-500">Tidak ditemukan</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelected(c)
                    setSearch('')
                  }}
                  className="w-full rounded-lg bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
                >
                  <p className="font-medium text-gray-900">{c.nama}</p>
                  <p className="text-xs text-gray-500">{c.hp || '—'}</p>
                </button>
              ))
            )}
          </div>
        )}

        {selected && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
            <div>
              <p className="font-medium text-gray-900">{selected.nama}</p>
              <p className="text-xs text-gray-500">{selected.hp || '—'}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-blue-600 hover:underline"
            >
              Ganti
            </button>
          </div>
        )}
      </div>

      {/* Form order */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Berat (Kg)</label>
          <input
            value={berat}
            onChange={(e) => setBerat(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
            placeholder="0"
            inputMode="decimal"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-600">Harga / Kg</span>
          <span className="font-semibold text-gray-900">{formatRupiah(hargaPerKg)}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-blue-600 px-3 py-3 text-white">
          <span className="font-medium">TOTAL</span>
          <span className="text-xl font-bold">{formatRupiah(total)}</span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Estimasi Selesai</label>
          <input
            value={estimasi}
            onChange={(e) => setEstimasi(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
            placeholder="cth: Besok sore"
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
          disabled={saving || !selected}
          className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'SIMPAN ORDER'}
        </button>
      </form>
    </div>
  )
}