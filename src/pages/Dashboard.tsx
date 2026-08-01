import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Hari Ini</h2>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Order Masuk</p>
          <p className="text-2xl font-bold text-gray-900">{orderMasuk}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Diproses</p>
          <p className="text-2xl font-bold text-orange-600">{diproses}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Siap Diambil</p>
          <p className="text-2xl font-bold text-orange-600">{siapDiambil}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Selesai</p>
          <p className="text-2xl font-bold text-green-600">{selesai}</p>
        </div>
      </div>

      {/* Pendapatan */}
      <div className="rounded-xl bg-orange-600 p-4 text-white shadow-sm">
        <p className="text-sm text-orange-100">Pendapatan Hari Ini</p>
        <p className="text-3xl font-bold">{formatRupiah(pendapatan)}</p>
      </div>

      {/* Menu Cepat */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/order-baru"
          className="rounded-xl bg-orange-600 p-4 text-center text-white shadow-sm transition hover:bg-orange-700"
        >
          <span className="text-2xl">➕</span>
          <p className="mt-1 font-semibold">Order Baru</p>
        </Link>
        <Link
          to="/pelanggan"
          className="rounded-xl bg-white p-4 text-center text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          <span className="text-2xl">👥</span>
          <p className="mt-1 font-semibold">Pelanggan</p>
        </Link>
        <Link
          to="/order-aktif"
          className="rounded-xl bg-white p-4 text-center text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          <span className="text-2xl">📋</span>
          <p className="mt-1 font-semibold">Order Aktif</p>
        </Link>
        <Link
          to="/riwayat"
          className="rounded-xl bg-white p-4 text-center text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          <span className="text-2xl">🕘</span>
          <p className="mt-1 font-semibold">Riwayat</p>
        </Link>
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