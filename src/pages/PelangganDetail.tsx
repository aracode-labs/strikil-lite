import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Customer, Order } from '../types'
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
} from 'lucide-react'

const statusColors: Record<string, string> = {
  Diterima: 'bg-gray-100 text-gray-700',
  Diproses: 'bg-orange-100 text-orange-700',
  'Siap Diambil': 'bg-orange-100 text-orange-700',
  Selesai: 'bg-green-100 text-green-700',
}

const paymentLabel: Record<string, string> = {
  cash: 'Cash',
  qris: 'QRIS',
  transfer: 'Transfer',
}

const statusPembayaranLabel: Record<string, string> = {
  belum_bayar: 'Belum Bayar',
  dp: 'DP',
  lunas: 'Lunas',
}

export default function PelangganDetail() {
  const { hp } = useParams<{ hp: string }>()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (hp) loadData(hp)
  }, [hp])

  async function loadData(phone: string) {
    // Cari customer by hp
    const { data: custData, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('hp', phone)
      .single()

    if (custError || !custData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setCustomer(custData as Customer)

    // Load orders untuk customer ini
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', custData.id)
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
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-orange-600" />
      </div>
    )
  }

  if (notFound || !customer) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
        <p className="text-lg font-semibold">Pelanggan tidak ditemukan</p>
        <p className="mt-1 text-sm">Nomor HP: {hp}</p>
        <Link
          to="/pelanggan"
          className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Kembali ke Daftar Pelanggan
        </Link>
      </div>
    )
  }

  const orderAktif = orders.filter((o) => o.status !== 'Selesai')
  const orderSelesai = orders.filter((o) => o.status === 'Selesai')
  const totalBelanja = orderSelesai.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="space-y-4">
      {/* Header Info Pelanggan */}
      <div className="rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 p-5 text-white shadow-sm">
        <h2 className="text-xl font-bold">{customer.nama}</h2>
        <div className="mt-2 space-y-1 text-sm text-orange-100">
          {customer.hp && (
            <p className="flex items-center gap-2">
              <Phone size={14} />
              {customer.hp}
            </p>
          )}
          {customer.alamat && (
            <p className="flex items-center gap-2">
              <MapPin size={14} />
              {customer.alamat}
            </p>
          )}
          {customer.catatan && (
            <p className="flex items-center gap-2">
              <StickyNote size={14} />
              {customer.catatan}
            </p>
          )}
          {customer.ongkir > 0 && (
            <p className="flex items-center gap-2">
              <Bike size={14} />
              Ongkir: {formatRupiah(customer.ongkir)}
            </p>
          )}
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <Wallet size={18} className="mx-auto text-green-600" />
          <p className="mt-1 text-xs text-gray-500">Deposit</p>
          <p className="text-sm font-bold text-gray-900">
            {formatRupiah(customer.deposit || 0)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <ClipboardList size={18} className="mx-auto text-orange-600" />
          <p className="mt-1 text-xs text-gray-500">Order Aktif</p>
          <p className="text-sm font-bold text-gray-900">{orderAktif.length}</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm">
          <CheckCircle2 size={18} className="mx-auto text-green-600" />
          <p className="mt-1 text-xs text-gray-500">Selesai</p>
          <p className="text-sm font-bold text-gray-900">{orderSelesai.length}</p>
        </div>
      </div>

      {/* Total Belanja */}
      <div className="rounded-xl bg-green-600 p-4 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Wallet size={18} />
          <p className="text-sm text-green-100">Total Belanja (Order Selesai)</p>
        </div>
        <p className="mt-1 text-2xl font-bold">{formatRupiah(totalBelanja)}</p>
      </div>

      {/* Order Aktif */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
          <Clock size={16} className="text-orange-600" />
          Order Terkini ({orderAktif.length})
        </h3>
        {orderAktif.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
            Tidak ada order aktif
          </div>
        ) : (
          <div className="space-y-2">
            {orderAktif.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                to={`/e-struk/${order.id}`}
                className="block rounded-xl bg-white p-3 shadow-sm transition hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {order.nomor_order}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.service_nama || 'Setrika'} ·{' '}
                      {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'} ·{' '}
                      {formatTanggal(order.created_at)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {paymentLabel[order.metode_pembayaran || 'cash']} ·{' '}
                      {statusPembayaranLabel[order.status_pembayaran || 'belum_bayar']}
                    </p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <p className="text-sm font-bold text-orange-600">
                      {formatRupiah(Number(order.total))}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Order */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
          <Package size={16} className="text-gray-600" />
          Riwayat Order ({orderSelesai.length})
        </h3>
        {orderSelesai.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
            Belum ada riwayat order
          </div>
        ) : (
          <div className="space-y-2">
            {orderSelesai.slice(0, 10).map((order) => (
              <Link
                key={order.id}
                to={`/e-struk/${order.id}`}
                className="block rounded-xl bg-white p-3 shadow-sm transition hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {order.nomor_order}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.service_nama || 'Setrika'} ·{' '}
                      {order.jumlah ?? order.berat} {order.satuan_label ?? 'Kg'} ·{' '}
                      {formatTanggal(order.created_at)}
                    </p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-700">
                      {formatRupiah(Number(order.total))}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Selesai
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Aksi */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/pelanggan"
          className="rounded-lg border border-gray-300 bg-white py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Kembali
        </Link>
        <Link
          to={`/order-baru`}
          className="rounded-lg bg-orange-600 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
        >
          + Order Baru
        </Link>
      </div>
    </div>
  )
}