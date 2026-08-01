import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Service } from '../types'

export default function Jasa() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nama, setNama] = useState('')
  const [kategori, setKategori] = useState<'kiloan' | 'satuan'>('kiloan')
  const [satuanLabel, setSatuanLabel] = useState('Kg')
  const [harga, setHarga] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadServices()
  }, [])

  async function loadServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('kategori', { ascending: true })
      .order('nama', { ascending: true })

    if (!error && data) {
      setServices(data as Service[])
    }
    setLoading(false)
  }

  function resetForm() {
    setNama('')
    setKategori('kiloan')
    setSatuanLabel('Kg')
    setHarga('')
    setEditingId(null)
    setError('')
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(s: Service) {
    setEditingId(s.id)
    setNama(s.nama)
    setKategori(s.kategori)
    setSatuanLabel(s.satuan_label)
    setHarga(String(s.harga))
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nama.trim()) {
      setError('Nama jasa wajib diisi')
      return
    }
    const hargaNum = parseFloat(harga) || 0
    if (hargaNum <= 0) {
      setError('Harga harus lebih dari 0')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      nama: nama.trim(),
      kategori,
      satuan_label: satuanLabel.trim() || 'Kg',
      harga: hargaNum,
    }

    let err = null
    if (editingId) {
      ;({ error: err } = await supabase.from('services').update(payload).eq('id', editingId))
    } else {
      ;({ error: err } = await supabase.from('services').insert(payload))
    }

    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }

    resetForm()
    setShowForm(false)
    loadServices()
  }

  async function handleDelete(s: Service) {
    const yakin = confirm(`Hapus jasa "${s.nama}"?`)
    if (!yakin) return

    const { error } = await supabase.from('services').delete().eq('id', s.id)

    if (error) {
      alert('Gagal menghapus: ' + error.message)
      return
    }

    loadServices()
  }

  const kiloan = services.filter((s) => s.kategori === 'kiloan')
  const satuan = services.filter((s) => s.kategori === 'satuan')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Jenis Jasa & Tarif</h2>
        <button
          onClick={() => (showForm ? setShowForm(false) : openAddForm())}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? 'Tutup' : '+ Jasa Baru'}
        </button>
      </div>

      {/* Form tambah / edit */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">
              {editingId ? '✏️ Edit Jasa' : '➕ Jasa Baru'}
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Nama Jasa *</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="cth: Setrika Express"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setKategori('kiloan')
                  setSatuanLabel('Kg')
                }}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  kategori === 'kiloan'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                📦 Kiloan
              </button>
              <button
                type="button"
                onClick={() => setKategori('satuan')}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  kategori === 'satuan'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                🧺 Satuan
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Satuan Label</label>
            <input
              value={satuanLabel}
              onChange={(e) => setSatuanLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="Kg / pcs / meter / set"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Harga (Rp) *</label>
            <input
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none"
              placeholder="0"
              inputMode="numeric"
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
            {saving ? 'Menyimpan...' : editingId ? 'UPDATE' : 'SIMPAN'}
          </button>
        </form>
      )}

      {/* Daftar Jasa */}
      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : services.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Belum ada jasa
        </div>
      ) : (
        <div className="space-y-4">
          {/* Kiloan */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Setrika Kiloan
            </p>
            <div className="space-y-2">
              {kiloan.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{s.nama}</p>
                    <p className="text-sm text-gray-500">
                      Rp {s.harga.toLocaleString('id-ID')} / {s.satuan_label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(s)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Satuan */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Cuci Satuan
            </p>
            <div className="space-y-2">
              {satuan.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{s.nama}</p>
                    <p className="text-sm text-gray-500">
                      Rp {s.harga.toLocaleString('id-ID')} / {s.satuan_label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(s)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}