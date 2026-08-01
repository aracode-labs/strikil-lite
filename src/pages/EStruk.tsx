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
    const pesan = encodeURIComponent(
      `*${settings?.nama_toko || 'Strikil'}*\n` +
        `Setrika Kiloan\n\n` +
        `No Order: ${order.nomor_order}\n` +
        `Nama: ${order.customers.nama}\n` +
        `Berat: ${order.berat} Kg\n` +
        `Total: ${formatRupiah(Number(order.total))}\n` +
        `Status: ${order.status}\n` +
        `Estimasi: ${order.estimasi_selesai || '-'}\n\n` +
        `Terima kasih 🙏`
    )
    window.open(`https://wa.me/${hp}?text=${pesan}`, '_blank')
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">E-Struk</h2>

      {/* Struk */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="border-b-2 border-dashed border-gray-300 pb-4 text-center">
          <h3 className="text-xl font-bold text-gray-900">{settings?.nama_toko || 'Strikil'}</h3>
          <p className="text-sm text-gray-500">Setrika Kiloan Cimahi</p>
          {settings?.alamat && <p className="text-xs text-gray-400">{settings.alamat}</p>}
        </div>

        <div className="space-y-2 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">No Order</span>
            <span className="font-semibold text-gray-900">{order.nomor_order}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nama</span>
            <span className="font-semibold text-gray-900">{order.customers?.nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Berat</span>
            <span className="font-semibold text-gray-900">{order.berat} Kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Harga / Kg</span>
            <span className="font-semibold text-gray-900">{formatRupiah(Number(order.harga_perkg))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-900">{formatRupiah(Number(order.total))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-semibold text-gray-900">{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tanggal Masuk</span>
            <span className="font-semibold text-gray-900">{formatTanggal(order.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Estimasi Selesai</span>
            <span className="font-semibold text-gray-900">{order.estimasi_selesai || '-'}</span>
          </div>
          {order.catatan && (
            <div className="flex justify-between">
              <span className="text-gray-500">Catatan</span>
              <span className="font-semibold text-gray-900">{order.catatan}</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-gray-300 pt-4 text-center text-xs text-gray-400">
          Terima kasih telah menggunakan jasa kami 🙏
        </div>
      </div>

      {/* Aksi */}
      <div className="space-y-2">
        <button
          onClick={handleWhatsApp}
          disabled={!order.customers?.hp}
          className="w-full rounded-lg bg-green-600 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Kirim WhatsApp
        </button>
        <button
          onClick={() => window.print()}
          className="w-full rounded-lg bg-gray-600 py-3 text-base font-semibold text-white hover:bg-gray-700"
        >
          Download PDF
        </button>
        <button
          onClick={() => navigate('/order-aktif')}
          className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700"
        >
          Selesai
        </button>
      </div>
    </div>
  )
}