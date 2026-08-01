import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, OrderStatus } from '../types'

const statusList: OrderStatus[] = ['Diterima', 'Diproses', 'Siap Diambil', 'Selesai']

const statusColors: Record<string, string> = {
  Diterima: 'bg-gray-100 text-gray-700',
  Diproses: 'bg-orange-100 text-orange-700',
  'Siap Diambil': 'bg-orange-100 text-orange-700',
  Selesai: 'bg-green-100 text-green-700',
}

const paymentStatusList = ['belum_bayar', 'dp', 'lunas'] as const

const paymentStatusColors: Record<string, string> = {
  belum_bayar: 'bg-red-100 text-red-700',
  dp: 'bg-yellow-100 text-yellow-700',
  lunas: 'bg-green-100 text-green-700',
}

export default function OrderAktif() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(nama, hp)')
      .neq('status', 'Selesai')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    setUpdatingId(null)

    if (!error) {
      loadOrders()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Order Aktif</h2>

      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          Tidak ada order aktif
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{order.customers?.nama}</p>
                  <p className="text-sm text-gray-500">
                    {order.nomor_order} · {order.service_nama || 'Setrika'} ·{' '}
                    {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'} ·{' '}
                    Rp {Number(order.total).toLocaleString('id-ID')}
                  </p>
                  {order.pengantaran === 'antar_jemput' && (
                    <p className="mt-0.5 text-xs text-orange-600">
                      🛵 Antar Jemput
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>

              {/* Pilihan status order */}
              <div className="mt-3 flex flex-wrap gap-2">
                {statusList.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order.id, s)}
                    disabled={updatingId === order.id || s === order.status}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      s === order.status
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Pilihan status pembayaran */}
              <div className="mt-2 flex flex-wrap gap-2">
                {paymentStatusList.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(order.id, s)}
                    disabled={updatingId === order.id || s === order.status_pembayaran}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      s === order.status_pembayaran
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {s === 'belum_bayar' ? 'Belum Bayar' : s === 'dp' ? 'DP' : 'Lunas'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}