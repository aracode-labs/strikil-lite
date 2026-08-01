export interface Customer {
  id: string
  nama: string
  hp: string
  alamat: string
  catatan: string
  created_at: string
}

export type OrderStatus = 'Diterima' | 'Diproses' | 'Siap Diambil' | 'Selesai'

export interface Order {
  id: string
  nomor_order: string
  customer_id: string
  berat: number
  harga_perkg: number
  total: number
  status: OrderStatus
  catatan: string
  estimasi_selesai: string
  created_at: string
  customers?: Customer
}

export interface Settings {
  id: number
  nama_toko: string
  alamat: string
  no_hp: string
  harga_perkg: number
  minimum_kg: number
}