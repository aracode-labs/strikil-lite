import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import {
  PlusCircle,
  Users,
  ClipboardList,
  History,
  Wallet,
  Package,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  Diterima: 'bg-gray-100 text-gray-700',
  Diproses: 'bg-orange-100 text-orange-700',
  'Siap Diambil': 'bg-orange-100 text-orange-700',
  Selesai: 'bg-green-100 text-green-700',
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(nama, hp)')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  const orderMasuk = orders.length
  const diproses = orders.filter((o) => o.status === 'Diproses').length
  const siapDiambil = orders.filter((o) => o.status === 'Siap Diambil').length
  const selesai = orders.filter((o) => o.status === 'Selesai').length
  const pendapatan = orders
    .filter((o) => o.status === 'Selesai')
    .reduce((sum, o) => sum + Number(o.total), 0)

  const orderAktif = orders.filter((o) => o.status !== 'Selesai')

  const formatRupiah = (n: number) =>
    'Rp ' + n.toLocaleString('id-ID')

  const stats = [
    { label: 'Order Masuk', value: orderMasuk, icon: Package, color: 'text-orange-600' },
    { label: 'Diproses', value: diproses, icon: Loader2, color: 'text-orange-600' },
    { label: 'Siap Diambil', value: siapDiambil, icon: CheckCircle2, color: 'text-orange-600' },
    { label: 'Selesai', value: selesai, icon: CheckCircle2, color: 'text-green-600' },
  ]

  const quickMenus = [
    { to: '/order-baru', label: 'Order Baru', icon: PlusCircle, bg: 'bg-orange-600 text-white hover:bg-orange-700' },
    { to: '/pelanggan', label: 'Pelanggan', icon: Users, bg: 'bg-white text-gray-800 hover:bg-gray-50' },
    { to: '/order-aktif', label: 'Order Aktif', icon: ClipboardList, bg: 'bg-white text-gray-800 hover:bg-gray-50' },
    { to: '/riwayat', label: 'Riwayat', icon: History, bg: 'bg-white text-gray-800 hover:bg-gray-50' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Hari Ini</h2>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <s.icon size={18} className={s.color} />
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pendapatan */}
      <div className="rounded-xl bg-orange-600 p-4 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Wallet size={18} />
          <p className="text-sm text-orange-100">Pendapatan Hari Ini</p>
        </div>
        <p className="mt-1 text-3xl font-bold">{formatRupiah(pendapatan)}</p>
      </div>

      {/* Menu Cepat */}
      <div className="grid grid-cols-2 gap-3">
        {quickMenus.map((m) => {
          const Icon = m.icon
          return (
            <Link
              key={m.to}
              to={m.to}
              className={`rounded-xl p-4 text-center shadow-sm transition ${m.bg}`}
            >
              <Icon size={24} className="mx-auto" />
              <p className="mt-1 font-semibold">{m.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Order Aktif */}
      <div>
        <h3 className="mb-2 text-lg font-bold text-gray-800">Order Aktif</h3>
        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : orderAktif.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
            Tidak ada order aktif
          </div>
        ) : (
          <div className="space-y-2">
            {orderAktif.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.customers?.nama}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.nomor_order} · {order.berat} Kg
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}