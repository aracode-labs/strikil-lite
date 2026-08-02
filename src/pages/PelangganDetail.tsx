import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer, Order, Settings } from '../types'
import {
  Phone,
  MapPin,
  StickyNote,
  Bike,
  Wallet,
  Package,
  Clock,
  CheckCircle2,
  Loader2,
  ClipboardList,
  CreditCard,
  User,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  Diterima: 'bg-gray-100 text-gray-700',
  Diproses: 'bg-orange-100 text-orange-700',
  'Siap Diambil': 'bg-green-100 text-green-700',
  Selesai: 'bg-gray-100 text-gray-600',
}

const statusPembayaranLabel: Record<string, string> = {
  belum_bayar: 'Belum Bayar',
  dp: 'DP',
  lunas: 'Lunas',
}

const paymentLabel: Record<string, string> = {
  cash: 'Cash',
  qris: 'QRIS',
  transfer: 'Transfer',
}

type Tab = 'info' | 'aktif' | 'riwayat' | 'pembayaran'

export default function PelangganDetail() {
  const { hp } = useParams<{ hp: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  useEffect(() => {
    if (hp) loadData(hp)
  }, [hp])

  async function loadData(phone: string) {
    const [custRes, settingsRes] = await Promise.all([
      supabase.from('customers').select('*').eq('hp', phone).single(),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ])

    if (custRes.error || !custRes.data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setCustomer(custRes.data as Customer)
    if (!settingsRes.error && settingsRes.data) {
      setSettings(settingsRes.data as Settings)
    }

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', custRes.data.id)
      .order('created_at', { ascending: false })

    if (orderData) {
      setOrders(orderData as Order[])
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-orange-600" />
      </div>
    )
  }

  if (notFound || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">🔍</div>
          <h1 className="text-xl font-bold text-gray-800">Pelanggan Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-gray-500">
            Nomor HP <span className="font-semibold">{hp}</span> tidak terdaftar.
          </p>
        </div>
      </div>
    )
  }

  const orderAktif = orders.filter((o) => o.status !== 'Selesai')
  const orderSelesai = orders.filter((o) => o.status === 'Selesai')
  const totalBelanja = orderSelesai.reduce((sum, o) => sum + Number(o.total), 0)
  const hasDeposit = Number(customer.deposit || 0) > 0

  const totalOrderAktif = orderAktif.reduce((sum, o) => sum + Number(o.total), 0)
  const totalLunasAktif = orderAktif
    .filter((o) => o.status_pembayaran === 'lunas')
    .reduce((sum, o) => sum + Number(o.total), 0)
  const sisaPembayaran = totalOrderAktif - totalLunasAktif

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'info', label: 'Info', icon: User },
    { key: 'aktif', label: 'Order Aktif', icon: Clock },
    { key: 'riwayat', label: 'Riwayat', icon: Package },
    { key: 'pembayaran', label: 'Pembayaran', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dengan greeting */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-8 text-center text-white">
        <img src="/logo.png" alt="Strikil" className="mx-auto mb-2 h-16 w-16 rounded-full object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">
          {settings?.nama_toko || 'STRIKIL'}
        </h1>
        <p className="mt-0.5 text-sm text-orange-100">- Setrika Kiloan Cimahi</p>
        <div className="mt-4 rounded-lg bg-white/10 px-4 py-2">
          <p className="text-xs text-orange-200">Halo,</p>
          <p className="text-lg font-bold">{customer.nama} 👋</p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-6">
        {/* Tabs */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition ${
                    activeTab === tab.key
                      ? 'border-b-2 border-orange-600 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-4">
            {/* Tab 1: Info Pelanggan */}
            {activeTab === 'info' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Informasi Pelanggan</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2.5">
                    <User size={16} className="shrink-0 text-gray-400" />
                    <span className="text-gray-500">Nama</span>
                    <span className="ml-auto font-semibold text-gray-900">{customer.nama}</span>
                  </div>
                  {customer.hp && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="shrink-0 text-gray-400" />
                      <span className="text-gray-500">No. HP</span>
                      <span className="ml-auto font-semibold text-gray-900">{customer.hp}</span>
                    </div>
                  )}
                  {customer.alamat && (
                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="shrink-0 text-gray-400" />
                      <span className="text-gray-500">Alamat</span>
                      <span className="ml-auto text-right font-semibold text-gray-900">{customer.alamat}</span>
                    </div>
                  )}
                  {customer.catatan && (
                    <div className="flex items-center gap-2.5">
                      <StickyNote size={16} className="shrink-0 text-gray-400" />
                      <span className="text-gray-500">Catatan</span>
                      <span className="ml-auto text-right font-semibold text-gray-900">{customer.catatan}</span>
                    </div>
                  )}
                  {customer.ongkir > 0 && (
                    <div className="flex items-center gap-2.5">
                      <Bike size={16} className="shrink-0 text-gray-400" />
                      <span className="text-gray-500">Ongkir</span>
                      <span className="ml-auto font-semibold text-gray-900">{formatRupiah(customer.ongkir)}</span>
                    </div>
                  )}
                </div>

                <div className="my-2 border-t border-dashed border-gray-200" />

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-orange-50 p-3 text-center">
                    <ClipboardList size={18} className="mx-auto text-orange-600" />
                    <p className="mt-1 text-xs text-gray-500">Order Aktif</p>
                    <p className="text-lg font-bold text-gray-900">{orderAktif.length}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <CheckCircle2 size={18} className="mx-auto text-green-600" />
                    <p className="mt-1 text-xs text-gray-500">Selesai</p>
                    <p className="text-lg font-bold text-gray-900">{orderSelesai.length}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-green-600 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} />
                    <p className="text-sm text-green-100">Total Belanja</p>
                  </div>
                  <p className="mt-1 text-2xl font-bold">{formatRupiah(totalBelanja)}</p>
                </div>
              </div>
            )}

            {/* Tab 2: Order Aktif */}
            {activeTab === 'aktif' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Order Sedang Berjalan</h3>
                {orderAktif.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                    <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                    Tidak ada order yang sedang berjalan
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderAktif.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{order.nomor_order}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
                          <p>{order.service_nama || 'Setrika'} · {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'}</p>
                          <p>Masuk: {formatTanggal(order.created_at)}</p>
                          {order.estimasi_selesai && <p>Estimasi: {order.estimasi_selesai}</p>}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                          <span className="text-xs text-gray-400">
                            {statusPembayaranLabel[order.status_pembayaran || 'belum_bayar']}
                          </span>
                          <span className="text-sm font-bold text-orange-600">{formatRupiah(Number(order.total))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Riwayat */}
            {activeTab === 'riwayat' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Riwayat Order</h3>
                {orderSelesai.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    Belum ada riwayat order
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderSelesai.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{order.nomor_order}</p>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            Selesai
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
                          <p>{order.service_nama || 'Setrika'} · {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'}</p>
                          <p>Tanggal: {formatTanggal(order.created_at)}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                          <span className="text-xs text-gray-400">
                            {paymentLabel[order.metode_pembayaran || 'cash']}
                          </span>
                          <span className="text-sm font-bold text-gray-700">{formatRupiah(Number(order.total))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Pembayaran */}
            {activeTab === 'pembayaran' && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Status Pembayaran</h3>

                {/* Deposit - hanya jika ada */}
                {hasDeposit && (
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className="text-green-600" />
                      <p className="text-sm font-semibold text-green-700">Saldo Deposit</p>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-green-700">
                      {formatRupiah(Number(customer.deposit || 0))}
                    </p>
                    <p className="mt-1 text-xs text-green-600">
                      Deposit ini dapat dipotong otomatis untuk pembayaran order
                    </p>
                  </div>
                )}

                {/* Ringkasan Pembayaran Order Aktif */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Order Aktif</p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Order Aktif</span>
                      <span className="font-semibold text-gray-900">{formatRupiah(totalOrderAktif)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sudah Dibayar</span>
                      <span className="font-semibold text-green-600">{formatRupiah(totalLunasAktif)}</span>
                    </div>
                    <div className="my-1.5 border-t border-dashed border-gray-200" />
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Sisa Pembayaran</span>
                      <span className={`font-bold ${sisaPembayaran > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatRupiah(sisaPembayaran)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail per Order */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Detail Order</p>
                  <div className="space-y-2">
                    {orderAktif.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{order.nomor_order}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            order.status_pembayaran === 'lunas'
                              ? 'bg-green-100 text-green-700'
                              : order.status_pembayaran === 'dp'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {statusPembayaranLabel[order.status_pembayaran || 'belum_bayar']}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                          <span>{paymentLabel[order.metode_pembayaran || 'cash']}</span>
                          <span className="font-semibold text-gray-700">{formatRupiah(Number(order.total))}</span>
                        </div>
                      </div>
                    ))}
                    {orderAktif.length === 0 && (
                      <p className="py-4 text-center text-sm text-gray-400">Tidak ada order aktif</p>
                    )}
                  </div>
                </div>

                {/* Total Belanja Selesai */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-gray-600" />
                    <p className="text-sm text-gray-500">Total Belanja (Selesai)</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-gray-900">{formatRupiah(totalBelanja)}</p>
                </div>

                {/* Info Pembayaran */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Cara Pembayaran
                  </p>

                  {/* Transfer Bank */}
                  <div className="mb-3 rounded-lg bg-blue-50 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                      🏦 Transfer Bank Mandiri
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-xs text-blue-900">
                      <p>No. Rekening: <span className="font-bold">1320011968675</span></p>
                      <p>a.n. <span className="font-semibold">Dewi Warna Ratna Sari</span></p>
                    </div>
                  </div>

                  {/* Gopay */}
                  <div className="mb-3 rounded-lg bg-green-50 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                      📱 Gopay
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-xs text-green-900">
                      <p>No. HP: <span className="font-bold">6281320447875</span></p>
                      <p>a.n. <span className="font-semibold">Dewi Warna Ratna Sari</span></p>
                    </div>
                  </div>

                  {/* QRIS */}
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      📲 QRIS
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Sedang dalam proses ⏳
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-xl bg-orange-50 p-5 text-center">
          <p className="text-sm font-medium text-gray-700">
            Terima kasih telah menjadi pelanggan kami 🙏
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
              <Phone size={16} />
              Hubungi Kami
            </a>
          )}
        </div>
      </div>
    </div>
  )
}