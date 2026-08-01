import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer, Service } from '../types'

export default function OrderBaru() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showAllServices, setShowAllServices] = useState(false)
  const [jumlah, setJumlah] = useState('')
  const [pengantaran, setPengantaran] = useState<'ditempat' | 'antar_jemput'>('ditempat')
  const [ongkir, setOngkir] = useState('')
  const [catatan, setCatatan] = useState('')
  const [estimasi, setEstimasi] = useState('')
  const [metodePembayaran, setMetodePembayaran] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [statusPembayaran, setStatusPembayaran] = useState<'belum_bayar' | 'dp' | 'lunas'>('belum_bayar')
  const [fotoPenimbangan, setFotoPenimbangan] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [servicesError, setServicesError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadCustomers()
    loadServices()
  }, [])

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, customer_service_prices(service_id, harga_custom)')
        .order('nama', { ascending: true })

      if (error) {
        // Jika tabel customer_service_prices belum ada, fallback ke query biasa
        if (error.message.includes('customer_service_prices') || error.code === '42P01') {
          console.warn('Tabel customer_service_prices belum ada, fallback ke query biasa')
          await loadCustomersFallback()
          return
        }
        console.error('Error loading customers:', error)
        return
      }

      if (data) {
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

    if (error) {
      setServicesError(true)
    } else if (data) {
      setServices(data as Service[])
      setServicesError(false)
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return c.nama.toLowerCase().includes(q) || c.hp.toLowerCase().includes(q)
  })

  const kiloanServices = services.filter((s) => s.kategori === 'kiloan')
  const satuanServices = services.filter((s) => s.kategori === 'satuan')

  const regulerService = kiloanServices.find((s) => s.nama === 'Setrika Reguler')

  // Default: Setrika Reguler terpilih otomatis
  useEffect(() => {
    if (!selectedService && regulerService) {
      setSelectedService(regulerService)
    }
  }, [regulerService, selectedService])

  const jumlahNum = parseFloat(jumlah) || 0
  const hargaSatuan = selectedService
    ? (selected?.customPrices?.[selectedService.id] ?? selectedService.harga)
    : 0
  const ongkirNum = parseFloat(ongkir) || 0
  const subtotal = jumlahNum * hargaSatuan
  const total = pengantaran === 'antar_jemput' ? subtotal + ongkirNum : subtotal

  const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected) {
      setError('Pilih pelanggan dulu')
      return
    }
    if (!selectedService) {
      setError('Pilih jenis jasa')
      return
    }
    if (jumlahNum <= 0) {
      setError(`Isi jumlah (${selectedService.satuan_label})`)
      return
    }
    setSaving(true)
    setError('')

    let fotoUrl: string | null = null

    // Upload foto penimbangan jika ada
    if (fotoPenimbangan) {
      const fileExt = fotoPenimbangan.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, fotoPenimbangan)

      if (uploadError) {
        setError('Gagal upload foto: ' + uploadError.message)
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
      fotoUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: selected.id,
        service_id: selectedService.id,
        service_nama: selectedService.nama,
        jumlah: jumlahNum,
        satuan_label: selectedService.satuan_label,
        harga_satuan: hargaSatuan,
        pengantaran,
        ongkir: pengantaran === 'antar_jemput' ? ongkirNum : 0,
        // Backward compat: isi kolom lama juga
        berat: selectedService.kategori === 'kiloan' ? jumlahNum : 0,
        harga_perkg: hargaSatuan,
        total,
        status: 'Diterima',
        catatan: catatan.trim(),
        estimasi_selesai: estimasi.trim(),
        metode_pembayaran: metodePembayaran,
        status_pembayaran: statusPembayaran,
        foto_penimbangan_url: fotoUrl,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

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
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
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
          <div className="mt-2 flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
            <div>
              <p className="font-medium text-gray-900">{selected.nama}</p>
              <p className="text-xs text-gray-500">{selected.hp || '—'}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-orange-600 hover:underline"
            >
              Ganti
            </button>
          </div>
        )}
      </div>

      {/* Form order */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        {/* Pilih Jenis Jasa */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Jasa</label>

          {servicesError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ Gagal memuat jenis jasa. Jalankan <code>migration_services.sql</code> di Supabase SQL Editor.
            </div>
          )}

          {!servicesError && services.length === 0 && (
            <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              ⏳ Memuat jenis jasa...
            </div>
          )}

          {!servicesError && services.length > 0 && (
            <>
              {/* Default: Setrika Reguler */}
              <div className="mt-2 rounded-lg border-2 border-orange-500 bg-orange-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      ✅ {selectedService?.nama || 'Setrika Reguler'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRupiah((selectedService || regulerService)?.harga || 0)}/
                      {(selectedService || regulerService)?.satuan_label || 'Kg'}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-orange-600">Default</span>
                </div>
              </div>

              {/* Tombol Lihat Lainnya */}
              {!showAllServices && (
                <button
                  type="button"
                  onClick={() => setShowAllServices(true)}
                  className="mt-2 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800"
                >
                  Lihat Jenis Jasa Lainnya ▼
                </button>
              )}

              {/* Expand: Semua jenis jasa */}
              {showAllServices && (
                <div className="mt-3 space-y-3">
                  {/* Kiloan */}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Setrika Kiloan
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {kiloanServices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedService(s)
                            setJumlah('')
                          }}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                            selectedService?.id === s.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-900">{s.nama}</span>
                          <span className="text-sm font-semibold text-gray-600">
                            {formatRupiah(s.harga)}/{s.satuan_label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Satuan */}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Cuci Satuan
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {satuanServices.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedService(s)
                            setJumlah('')
                          }}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                            selectedService?.id === s.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-900">{s.nama}</span>
                          <span className="text-sm font-semibold text-gray-600">
                            {formatRupiah(s.harga)}/{s.satuan_label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tombol Tutup */}
                  <button
                    type="button"
                    onClick={() => setShowAllServices(false)}
                    className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800"
                  >
                    ▲ Tutup Jenis Jasa
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Jumlah */}
        {selectedService && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jumlah ({selectedService.satuan_label})
              </label>
              <input
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
                placeholder={selectedService.kategori === 'kiloan' ? '0' : '1'}
                inputMode="decimal"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-600">
                Harga / {selectedService.satuan_label}
              </span>
              <span className="font-semibold text-gray-900">{formatRupiah(hargaSatuan)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-orange-600 px-3 py-3 text-white">
              <span className="font-medium">SUBTOTAL</span>
              <span className="text-xl font-bold">{formatRupiah(subtotal)}</span>
            </div>
          </>
        )}

        {/* Foto Penimbangan */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Foto Penimbangan (opsional)
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setFotoPenimbangan(file)
              setFotoPreview(file ? URL.createObjectURL(file) : null)
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
          />
          {fotoPreview && (
            <div className="mt-2">
              <img src={fotoPreview} alt="Preview" className="mx-auto h-32 w-32 rounded-lg object-cover" />
            </div>
          )}
        </div>

        {/* Pembayaran */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Metode Pembayaran</label>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'qris', 'transfer'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetodePembayaran(m)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  metodePembayaran === m
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {m === 'cash' ? '💵 Cash' : m === 'qris' ? '📱 QRIS' : '🏦 Transfer'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status Pembayaran</label>
          <div className="grid grid-cols-3 gap-2">
            {(['belum_bayar', 'dp', 'lunas'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusPembayaran(s)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  statusPembayaran === s
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {s === 'belum_bayar' ? '❌ Belum Bayar' : s === 'dp' ? '💰 DP' : '✅ Lunas'}
              </button>
            ))}
          </div>
        </div>

        {/* Pengantaran */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pengantaran</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPengantaran('ditempat')
                setOngkir('')
              }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                pengantaran === 'ditempat'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🏪 Di Tempat
            </button>
            <button
              type="button"
              onClick={() => {
                setPengantaran('antar_jemput')
                // Auto-isi ongkir dari data pelanggan
                setOngkir(selected?.ongkir ? String(selected.ongkir) : '')
              }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                pengantaran === 'antar_jemput'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🛵 Antar Jemput
            </button>
          </div>
        </div>

        {/* Ongkir */}
        {pengantaran === 'antar_jemput' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ongkir (Rp)</label>
              <input
                value={ongkir}
                onChange={(e) => setOngkir(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
                placeholder="0"
                inputMode="numeric"
              />
              {selected?.ongkir ? (
                <p className="mt-1 text-xs text-gray-400">
                  Ongkir default pelanggan: {formatRupiah(selected.ongkir)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Belum ada ongkir default untuk pelanggan ini
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-600">Ongkir</span>
              <span className="font-semibold text-gray-900">{formatRupiah(ongkirNum)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-orange-600 px-3 py-3 text-white">
              <span className="font-medium">TOTAL</span>
              <span className="text-xl font-bold">{formatRupiah(total)}</span>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Estimasi Selesai</label>
          <input
            value={estimasi}
            onChange={(e) => setEstimasi(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
            placeholder="cth: Besok sore"
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

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={saving || !selected || !selectedService}
          className="w-full rounded-lg bg-orange-600 py-3 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'SIMPAN ORDER'}
        </button>
      </form>
    </div>
  )
}