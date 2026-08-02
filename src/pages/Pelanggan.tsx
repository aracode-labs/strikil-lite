import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Customer, Service } from '../types'
import {
  Phone,
  MapPin,
  StickyNote,
  Bike,
  Wallet,
  Pencil,
  Trash2,
  X,
  Plus,
  Minus,
  Search,
} from 'lucide-react'

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
  const [deposit, setDeposit] = useState('')
  const [saving, setSaving] = useState(false)
  const [depositModal, setDepositModal] = useState<Customer | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositSaving, setDepositSaving] = useState(false)
  const [depositError, setDepositError] = useState('')
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
    setDeposit('')
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
    setDeposit(c.deposit ? String(c.deposit) : '')
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
      deposit: parseFloat(deposit) || 0,
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

  async function handleTopUp() {
    if (!depositModal) return
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) {
      setDepositError('Masukkan jumlah yang valid')
      return
    }
    setDepositSaving(true)
    setDepositError('')

    const newDeposit = (depositModal.deposit || 0) + amount
    const { error } = await supabase
      .from('customers')
      .update({ deposit: newDeposit })
      .eq('id', depositModal.id)

    setDepositSaving(false)

    if (error) {
      setDepositError(error.message)
      return
    }

    setDepositModal(null)
    loadCustomers()
  }

  async function handleKurangi() {
    if (!depositModal) return
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) {
      setDepositError('Masukkan jumlah yang valid')
      return
    }
    setDepositSaving(true)
    setDepositError('')

    const newDeposit = (depositModal.deposit || 0) - amount
    if (newDeposit < 0) {
      setDepositError('Deposit tidak bisa negatif')
      setDepositSaving(false)
      return
    }

    const { error } = await supabase
      .from('customers')
      .update({ deposit: newDeposit })
      .eq('id', depositModal.id)

    setDepositSaving(false)

    if (error) {
      setDepositError(error.message)
      return
    }

    setDepositModal(null)
    loadCustomers()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Pelanggan</h2>
        <button
          onClick={() => (showForm ? setShowForm(false) : openAddForm())}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
              placeholder="Nama pelanggan"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nomor HP</label>
            <input
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
              placeholder="08xxxxxxxxxx"
              inputMode="tel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Alamat</label>
            <input
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
              placeholder="Alamat"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
            <input
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
              placeholder="0"
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-gray-400">
              Tarif ongkir untuk antar jemput (opsional)
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              💰 Deposit (Rp)
            </label>
            <input
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
              placeholder="0"
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-gray-400">
              Saldo deposit pelanggan, akan dipotong otomatis saat order
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
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm focus:border-orange-500 focus:outline-none"
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
            className="w-full rounded-lg bg-orange-600 py-3 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : editingId ? 'UPDATE' : 'SIMPAN'}
          </button>
        </form>
      )}

      {/* Pencarian */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-base focus:border-orange-500 focus:outline-none"
          placeholder="Cari nama / nomor HP"
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
              {/* Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{c.nama}</p>
                  <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                    {c.hp && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate">{c.hp}</span>
                      </p>
                    )}
                    {c.alamat && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{c.alamat}</span>
                      </p>
                    )}
                    {c.catatan && (
                      <p className="flex items-center gap-1.5">
                        <StickyNote size={12} className="shrink-0" />
                        <span className="truncate">{c.catatan}</span>
                      </p>
                    )}
                    {c.ongkir > 0 && (
                      <p className="flex items-center gap-1.5">
                        <Bike size={12} className="shrink-0" />
                        <span>Ongkir: Rp {c.ongkir.toLocaleString('id-ID')}</span>
                      </p>
                    )}
                  </div>
                </div>
                {/* Deposit badge */}
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    c.deposit > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <Wallet size={12} />
                  Rp {(c.deposit || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Action row */}
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-2">
                <button
                  onClick={() => {
                    setDepositModal(c)
                    setDepositAmount('')
                    setDepositError('')
                  }}
                  className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                  title="Kelola deposit"
                >
                  <Wallet size={18} />
                </button>
                <button
                  onClick={() => openEditForm(c)}
                  className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"
                  title="Edit pelanggan"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Hapus pelanggan"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Deposit */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Wallet size={18} className="text-green-600" />
                Kelola Deposit
              </h3>
              <button
                onClick={() => setDepositModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-3 rounded-lg bg-green-50 px-4 py-3">
              <p className="text-xs text-green-600">Saldo Deposit Saat Ini</p>
              <p className="text-xl font-bold text-green-700">
                Rp {(depositModal.deposit || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jumlah (Rp)
              </label>
              <input
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-green-500 focus:outline-none"
                placeholder="0"
                inputMode="numeric"
              />
            </div>

            {depositError && (
              <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {depositError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTopUp}
                disabled={depositSaving}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Plus size={16} />
                Tambah
              </button>
              <button
                onClick={handleKurangi}
                disabled={depositSaving}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Minus size={16} />
                Kurangi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
