import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order, Settings } from '../types'

export default function EStruk() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const [orderRes, settingsRes] = await Promise.all([
      supabase.from('orders').select('*, customers(nama, hp)').eq('id', id).single(),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ])

    if (!orderRes.error && orderRes.data) {
      setOrder(orderRes.data as Order)
    }
    if (!settingsRes.error && settingsRes.data) {
      setSettings(settingsRes.data as Settings)
    }
    setLoading(false)
  }

  const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  const formatTanggal = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function handleWhatsApp() {
    if (!order || !order.customers?.hp) return
    const hp = order.customers.hp.replace(/[^0-9]/g, '')
    const progressUrl = `${window.location.origin}/progress/${order.nomor_order}`
    const logoUrl = `${window.location.origin}/logo.png`
    const pesan = encodeURIComponent(
      `*${settings?.nama_toko || 'Strikil'}*\n` +
        `Setrika Kiloan Cimahi\n\n` +
        `No Order: ${order.nomor_order}\n` +
        `Nama: ${order.customers.nama}\n` +
        `Berat: ${order.berat} Kg\n` +
        `Total: ${formatRupiah(Number(order.total))}\n` +
        `Status: ${order.status}\n` +
        `Estimasi: ${order.estimasi_selesai || '-'}\n\n` +
        `Logo: ${logoUrl}\n\n` +
        `Lacak progress order Anda:\n${progressUrl}\n\n` +
        `Terima kasih 🙏`
    )
    window.open(`https://wa.me/${hp}?text=${pesan}`, '_blank')
  }

  function getProgressUrl() {
    if (!order) return ''
    return `${window.location.origin}/progress/${order.nomor_order}`
  }

  async function copyProgressLink() {
    const url = getProgressUrl()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
      window.prompt('Salin link ini:', url)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Memuat...</p>
  }

  if (!order) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
        Order tidak ditemukan
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    Diterima: 'bg-orange-100 text-orange-700',
    Diproses: 'bg-yellow-100 text-yellow-700',
    'Siap Diambil': 'bg-green-100 text-green-700',
    Selesai: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">E-Struk</h2>

      {/* Struk */}
      <div className="estruk-paper mx-auto max-w-sm overflow-hidden rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="estruk-header bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-5 text-center text-white">
          <img src="/logo.png" alt="Strikil Lite" className="mx-auto mb-2 h-16 w-16 rounded-full object-contain" />
          <h3 className="text-2xl font-bold tracking-tight">
            {settings?.nama_toko || 'STRIKIL'}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-orange-100">- Setrika Kiloan Cimahi</p>
          <p className="mt-1 text-xs text-orange-200">
            {settings?.alamat || 'Isatana Gardenia - Adelia 1 no 1.6'}
          </p>
          {settings?.no_hp && (
            <p className="mt-0.5 text-xs text-orange-200">Telp: {settings.no_hp}</p>
          )}
        </div>

        {/* Nomor Order Banner */}
        <div className="flex items-center justify-between border-b border-dashed border-gray-300 px-6 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">No. Order</p>
            <p className="text-lg font-bold text-gray-900">{order.nomor_order}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusColors[order.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Detail */}
        <div className="space-y-2.5 px-6 py-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Nama</span>
            <span className="text-right font-semibold text-gray-900">
              {order.customers?.nama}
            </span>
          </div>
          {order.customers?.hp && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">No. HP</span>
              <span className="font-semibold text-gray-900">{order.customers.hp}</span>
            </div>
          )}
          <div className="my-2 border-t border-dashed border-gray-200" />
          {/* Jenis Jasa */}
          {order.service_nama && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Jenis Jasa</span>
              <span className="text-right font-semibold text-gray-900">{order.service_nama}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Jumlah</span>
            <span className="font-semibold text-gray-900">
              {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">
              Harga / {order.satuan_label ?? 'Kg'}
            </span>
            <div className="text-right">
              <span className="font-semibold text-gray-900">
                {formatRupiah(Number(order.harga_satuan ?? order.harga_perkg))}
              </span>
              {order.customers?.customPrices?.[order.service_id ?? ''] && (
                <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                  Custom
                </span>
              )}
            </div>
          </div>
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold text-gray-900">
              {formatRupiah(Number(order.total) - Number(order.ongkir ?? 0))}
            </span>
          </div>
          {order.pengantaran === 'antar_jemput' && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">🛵 Ongkir</span>
              <span className="font-semibold text-gray-900">
                {formatRupiah(Number(order.ongkir ?? 0))}
              </span>
            </div>
          )}
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex justify-between gap-4">
            <span className="text-lg text-gray-700">Total</span>
            <span className="text-lg font-bold text-orange-600">
              {formatRupiah(Number(order.total))}
            </span>
          </div>
          {/* Pengantaran */}
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Pengantaran</span>
            <span className="font-semibold text-gray-900">
              {order.pengantaran === 'antar_jemput' ? '🛵 Antar Jemput' : '🏪 Di Tempat'}
            </span>
          </div>
          <div className="my-2 border-t border-dashed border-gray-200" />
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Tanggal Masuk</span>
            <span className="text-right font-semibold text-gray-900">
              {formatTanggal(order.created_at)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Estimasi Selesai</span>
            <span className="text-right font-semibold text-gray-900">
              {order.estimasi_selesai || '-'}
            </span>
          </div>
          {order.catatan && (
            <>
              <div className="my-2 border-t border-dashed border-gray-200" />
              <div>
                <p className="text-gray-500">Catatan</p>
                <p className="mt-0.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  {order.catatan}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed border-gray-300 px-6 py-4 text-center">
          <p className="text-sm font-medium text-gray-700">
            Terima kasih telah menggunakan jasa kami 🙏
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Simpan struk ini sebagai bukti pengambilan
          </p>
          <div className="mt-3 rounded-lg bg-orange-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-orange-400">Lacak Order</p>
            <p className="break-all text-xs font-medium text-orange-600">{getProgressUrl()}</p>
          </div>
        </div>
      </div>

      {/* Aksi */}
      <div className="estruk-actions mx-auto max-w-sm space-y-2">
        <button
          onClick={handleWhatsApp}
          disabled={!order.customers?.hp}
          className="w-full rounded-lg bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          📱 Kirim WhatsApp
        </button>
        <button
          onClick={copyProgressLink}
          className="w-full rounded-lg bg-orange-600 py-3 text-base font-semibold text-white hover:bg-orange-700"
        >
          {copied ? '✅ Link Tersalin!' : '🔗 Salin Link Progress'}
        </button>
        <button
          onClick={() => window.print()}
          className="w-full rounded-lg bg-gray-600 py-3 text-base font-semibold text-white hover:bg-gray-700"
        >
         ️ Download PDF
        </button>
        <button
          onClick={() => navigate('/order-aktif')}
          className="w-full rounded-lg border border-gray-300 bg-white py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
        >
          Selesai
        </button>
      </div>
    </div>
  )
}