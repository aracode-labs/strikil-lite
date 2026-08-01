import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Settings } from '../types'

export default function Pengaturan() {
  const [namaToko, setNamaToko] = useState('')
  const [hargaPerKg, setHargaPerKg] = useState('')
  const [minimumKg, setMinimumKg] = useState('')
  const [noHp, setNoHp] = useState('')
  const [alamat, setAlamat] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (!error && data) {
      const s = data as Settings
      setNamaToko(s.nama_toko)
      setHargaPerKg(String(s.harga_perkg))
      setMinimumKg(String(s.minimum_kg))
      setNoHp(s.no_hp)
      setAlamat(s.alamat)
    }
    setLoading(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const harga = parseFloat(hargaPerKg) || 0
    const minKg = parseFloat(minimumKg) || 0

    if (harga <= 0) {
      setError('Harga per kg harus diisi')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('settings')
      .update({
        nama_toko: namaToko.trim(),
        harga_perkg: harga,
        minimum_kg: minKg,
        no_hp: noHp.trim(),
        alamat: alamat.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Pengaturan disimpan')
  }

  if (loading) {
    return <p className="text-gray-500">Memuat...</p>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Pengaturan</h2>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nama Usaha</label>
          <input
            value={namaToko}
            onChange={(e) => setNamaToko(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
            placeholder="Strikil"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Harga per Kg (Rp)</label>
          <input
            value={hargaPerKg}
            onChange={(e) => setHargaPerKg(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
            placeholder="7000"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Minimum Kg</label>
          <input
            value={minimumKg}
            onChange={(e) => setMinimumKg(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-orange-500 focus:outline-none"
            placeholder="2"
            inputMode="decimal"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
          <input
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
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
            placeholder="Alamat usaha"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-orange-600 py-3 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'SIMPAN'}
        </button>
      </form>
    </div>
  )
}