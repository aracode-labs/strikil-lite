import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

const statusColors: Record<string, string> = {
  Diterima: 'bg-gray-100 text-gray-700',
  Diproses: 'bg-blue-100 text-blue-700',
  'Siap Diambil': 'bg-orange-100 text-orange-700',
  Selesai: 'bg-green-100 text-green-700',
}

export default function Riwayat() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(nama, hp)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return (
      o.nomor_order.toLowerCase().includes(q) ||
      (o.customers?.nama || '').toLowerCase().includes(q) ||
      (o.customers?.hp || '').toLowerCase().includes(q)
    )
  })

  const formatTanggal = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Riwayat</h2>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
        placeholder="🔍 Cari nama / HP / no order"
      />

      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          {search ? 'Tidak ditemukan' : 'Belum ada order'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/e-struk/${o.id}`)}
              className="w-full rounded-xl bg-white p-4 text-left shadow-sm transition hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{o.customers?.nama}</p>
                  <p className="text-xs text-gray-500">
                    {o.nomor_order} · {formatTanggal(o.created_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {o.service_nama || 'Setrika'} · {o.jumlah ?? o.berat} {o.satuan_label ?? 'Kg'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    Rp {Number(o.total).toLocaleString('id-ID')}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.status]}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}