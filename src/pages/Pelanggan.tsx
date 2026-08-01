import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Customer, Service } from '../types'

export default function Pelanggan() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [hp, setHp] = useState('')
  const [alamat, setAlamat] = useState('')
  const [catatan, setCatatan] = useState('')
  const [ongkir, setOngkir] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    loadCustomers()
    loadServices()
  }, [])

  async function loadCustomers() {
    setLoadError('')
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, customer_service_prices(service_id, harga_custom)')
        .order('nama', { ascending: true })

      if (error) {
        if (error.message.includes('customer_service_prices') || error.code === '42P01') {
          console.warn('Tabel customer_service_prices belum ada, fallback')
          await loadCustomersFallback()
          return
        }
        setLoadError(error.message)
        console.error('Error loading customers:', error)
      } else if (data) {
        const customersWithPrices = data.map((c: any) => {
          const prices: Record<string, number> = {}
          if (c.customer_service_prices) {
            c.customer_service_prices.forEach((p: any) => {
              if (p.harga_custom != null) prices[p.service_id] = p.harga_custom
            })
          }
          return { ...c, customPrices: prices }
        })
        setCustomers(customersWithPrices as any[])
      }
    } catch (err) {
      console.error('Exception loading customers:', err)
      await loadCustomersFallback()
    }
    setLoading(false)
  }

  async function loadCustomersFallback() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('nama', { ascending: true })

    if (!error && data) {
      setCustomers(data as Customer[])
    }
  }

  async function loadServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('kategori', { ascending: true })
      .order('nama', { ascending: true })

    if (!error && data) {
      setServices(data as Service[])
    }
  }

  async function loadCustomersWithPrices() {
    setLoadError('')
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, customer_service_prices(service_id, harga_custom)')
        .order('nama', { ascending: true })

      if (error) {
        // Jika tabel customer_service_prices belum ada, fallback ke loadCustomers biasa
        if (error.message.includes('customer_service_prices') || error.code === '42P01') {
          console.warn('Tabel customer_service_prices belum ada, menggunakan data tanpa harga custom')
          await loadCustomers()
          return
        }
        setLoadError(error.message)
        console.error('Error loading customers:', error)
      } else if (data) {
        const customersWithPrices = data.map((c: any) => {
          const prices: Record<string, number> = {}
          if (c.customer_service_prices) {
            c.customer_service_prices.forEach((p: any) => {
              if (p.harga_custom != null) prices[p.service_id] = p.harga_custom
            })
          }
          return { ...c, customPrices: prices }
        })
        setCustomers(customersWithPrices as any[])
        console.log('Customers loaded with prices:', data.length)
      }
    } catch (err) {
      console.error('Exception loading customers:', err)
      await loadCustomers()
    }
    setLoading(false)
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.nama.toLowerCase().includes(q) || c.hp.toLowerCase().includes(q)
  })

  function resetForm() {
    setNama('')
    setHp('')
    setAlamat('')
    setCatatan('')
    setOngkir('')
    setEditingId(null)
    setError('')
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(c: Customer) {
    setEditingId(c.id)
    setNama(c.nama)
    setHp(c.hp)
    setAlamat(c.alamat)
    setCatatan(c.catatan)
    setOngkir(c.ongkir ? String(c.ongkir) : '')
    if (c.customPrices) {
      setCustomPrices(c.customPrices)
    } else {
      setCustomPrices({})
    }
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) {
      setError('Nama wajib diisi')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      nama: nama.trim(),
      hp: hp.trim(),
      alamat: alamat.trim(),
      catatan: catatan.trim(),
      ongkir: parseFloat(ongkir) || 0,
    }

    let error = null
    if (editingId) {
      // UPDATE
      ;({ error } = await supabase.from('customers').update(payload).eq('id', editingId))
    } else {
      // CREATE
      ;({ error } = await supabase.from('customers').insert(payload))
    }

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    // Save custom prices jika ada jasa yang diisi
    if (editingId && Object.keys(customPrices).length > 0) {
      await saveCustomPrices(editingId)
    }

    setSaving(false)
    resetForm()
    setShowForm(false)
    loadCustomers()
  }

  async function saveCustomPrices(customerId: string) {
    const { data: servicesData } = await supabase.from('services').select('id')

    if (!servicesData) return

    for (const service of servicesData) {
      const harga = customPrices[service.id]
      const { error } = await supabase
        .from('customer_service_prices')
        .upsert(
          {
            customer_id: customerId,
            service_id: service.id,
            harga_custom: harga || null,
          },
          { onConflict: 'customer_id,service_id' }
        )

      if (error) {
        console.error('Error saving custom price:', error)
      }
    }
  }

  function handleCustomPriceChange(serviceId: string, value: string) {
    const num = parseFloat(value)
    setCustomPrices((prev) => ({
      ...prev,
      [serviceId]: isNaN(num) ? 0 : num,
    }))
  }

  async function handleDelete(c: Customer) {
    const yakin = confirm(`Hapus pelanggan "${c.nama}"? Tindakan ini tidak bisa dibatalkan.`)
    if (!yakin) return

    const { error } = await supabase.from('customers').delete().eq('id', c.id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }

    loadCustomers()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Pelanggan</h2>
        <button
          onClick={() => (showForm ? setShowForm(false) : openAddForm())}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? 'Tutup' : '+ Pelanggan Baru'}
        </button>
      </div>

      {/* Form tambah / edit */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">
              {editingId ? '✏️ Edit Pelanggan' : '➕ Pelanggan Baru'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Batal edit
              </button>
            )}
          </div>

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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ongkir Default (Rp)
            </label>
            <input
              value={ongkir}
              onChange={(e) => setOngkir(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="0"
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-gray-400">
              Tarif ongkir untuk antar jemput (opsional)
            </p>
          </div>

          {/* Tarif Custom per Jasa */}
          {services.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tarif Custom per Jasa (Rp)
              </label>
              <p className="mb-1 text-xs text-gray-400">
                Kosongkan untuk menggunakan harga default
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{s.nama}</p>
                      <p className="text-xs text-gray-400">
                        Default: Rp {s.harga.toLocaleString('id-ID')}/{s.satuan_label}
                      </p>
                    </div>
                    <input
                      type="number"
                      value={customPrices[s.id] || ''}
                      onChange={(e) => handleCustomPriceChange(s.id, e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Default"
                      inputMode="numeric"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : editingId ? 'UPDATE' : 'SIMPAN'}
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

      {/* Error loading */}
      {loadError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ Gagal memuat pelanggan: {loadError}
        </div>
      )}

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
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{c.nama}</p>
                  <p className="text-sm text-gray-500">{c.hp || '—'}</p>
                  {c.alamat && <p className="mt-0.5 text-xs text-gray-400">📍 {c.alamat}</p>}
                  {c.catatan && <p className="mt-0.5 text-xs text-gray-400">📝 {c.catatan}</p>}
                  {c.ongkir > 0 && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      🛵 Ongkir: Rp {c.ongkir.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
                <div className="ml-2 flex shrink-0 gap-1">
                  <button
                    onClick={() => openEditForm(c)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    title="Edit pelanggan"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    title="Hapus pelanggan"
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}