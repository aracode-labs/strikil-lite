import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order, Settings } from '../types'

export default function Progress() {
  const { nomorOrder } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadData()
  }, [nomorOrder])

  async function loadData() {
    if (!nomorOrder) {
      setLoading(false)
      return
    }

    const [orderRes, settingsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, customers(nama, hp)')
        .eq('nomor_order', nomorOrder)
        .single(),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ])

    if (orderRes.error || !orderRes.data) {
      setNotFound(true)
    } else {
      // Pastikan customers tidak null (RLS bisa block join)
      const orderData = orderRes.data as Order
      if (!orderData.customers) {
        orderData.customers = { nama: '-', hp: '' } as Order['customers']
      }
      setOrder(orderData)
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

  // Timeline steps
  const steps = [
    { key: 'Diterima', label: 'Diterima', icon: '📥', desc: 'Order diterima oleh toko' },
    { key: 'Diproses', label: 'Diproses', icon: '🧺', desc: 'Sedang disetrika' },
    { key: 'Siap Diambil', label: 'Siap Diambil', icon: '✅', desc: 'Order siap diambil' },
    { key: 'Selesai', label: 'Selesai', icon: '🎉', desc: 'Order telah diambil' },
  ]

  const currentStepIndex = order
    ? steps.findIndex((s) => s.key === order.status)
    : -1

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
          <p className="text-sm text-gray-500">Memuat progress order...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">🔍</div>
          <h1 className="text-xl font-bold text-gray-800">Order Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-gray-500">
            Nomor order <span className="font-semibold">"{nomorOrder}"</span> tidak ditemukan.
            Periksa kembali nomor order Anda.
          </p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-8 text-center text-white">
        <img src="/logo.png" alt="Strikil Lite" className="mx-auto mb-2 h-16 w-16 object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">
          {settings?.nama_toko || 'Strikil'}
        </h1>
        <p className="mt-0.5 text-sm text-orange-100">Setrika Kiloan Cimahi</p>
        <p className="mt-1 text-xs text-orange-200">
          {settings?.alamat || 'Isatana Gardenia - Adelia 1 no 1.6'}
        </p>
      </div>

      <div className="mx-auto max-w-md px-4 py-6">
        {/* Info Order */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">No. Order</p>
              <p className="text-lg font-bold text-gray-900">{order.nomor_order}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.status === 'Diterima'
                  ? 'bg-orange-100 text-orange-700'
                  : order.status === 'Diproses'
                    ? 'bg-yellow-100 text-yellow-700'
                    : order.status === 'Siap Diambil'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="my-3 border-t border-dashed border-gray-200" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nama</span>
              <span className="font-semibold text-gray-900">{order.customers?.nama}</span>
            </div>
            {order.service_nama && (
              <div className="flex justify-between">
                <span className="text-gray-500">Jenis Jasa</span>
                <span className="text-right font-semibold text-gray-900">{order.service_nama}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Jumlah</span>
              <span className="font-semibold text-gray-900">
                {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Harga / {order.satuan_label ?? 'Kg'}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {formatRupiah(Number(order.harga_satuan ?? order.harga_perkg))}
                </span>
                {order.customers?.customPrices?.[order.service_id ?? ''] && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                    Custom
                  </span>
                )}
              </div>
            </div>
            {order.pengantaran === 'antar_jemput' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(Number(order.total) - Number(order.ongkir ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">🛵 Ongkir</span>
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(Number(order.ongkir ?? 0))}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-orange-600">{formatRupiah(Number(order.total))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pengantaran</span>
              <span className="font-semibold text-gray-900">
                {order.pengantaran === 'antar_jemput' ? '🛵 Antar Jemput' : '🏪 Di Tempat'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Masuk</span>
              <span className="font-semibold text-gray-900">{formatTanggal(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimasi Selesai</span>
              <span className="font-semibold text-gray-900">
                {order.estimasi_selesai || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-700">Progress Order</h2>

          <div className="space-y-0">
            {steps.map((step, index) => {
              const isDone = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              const isLast = index === steps.length - 1

              return (
                <div key={step.key} className="flex gap-3">
                  {/* Icon & Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition-all ${
                        isDone
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}
                    >
                      {isDone ? step.icon : '○'}
                    </div>
                    {!isLast && (
                      <div
                        className={`my-1 w-0.5 flex-1 ${isDone ? 'bg-orange-600' : 'bg-gray-200'}`}
                        style={{ minHeight: '28px' }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                    <p
                      className={`text-sm font-semibold ${
                        isDone ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-xs ${isDone ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      {step.desc}
                    </p>
                    {isCurrent && (
                      <span className="mt-1 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                        Status saat ini
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Catatan */}
        {order.catatan && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Catatan</p>
            <p className="mt-1 text-sm text-gray-700">{order.catatan}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 rounded-xl bg-orange-50 p-5 text-center">
          <p className="text-sm font-medium text-gray-700">
            Terima kasih telah menggunakan jasa kami 🙏
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {settings?.nama_toko || 'Strikil'} — Setrika Kiloan Cimahi
          </p>
          {settings?.no_hp && (
            <a
              href={`https://wa.me/${settings.no_hp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              📱 Hubungi Kami
            </a>
          )}
        </div>
      </div>
    </div>
  )
}