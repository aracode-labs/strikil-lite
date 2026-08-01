export interface Customer {
  id: string
  nama: string
  hp: string
  alamat: string
  catatan: string
  ongkir: number
  created_at: string
  customPrices?: Record<string, number>
}

export type OrderStatus = 'Diterima' | 'Diproses' | 'Siap Diambil' | 'Selesai'

export type PaymentStatus = 'belum_bayar' | 'dp' | 'lunas'
export type PaymentMethod = 'cash' | 'qris' | 'transfer'

export interface Service {
  id: string
  nama: string
  kategori: 'kiloan' | 'satuan'
  satuan_label: string
  harga: number
  created_at: string
}

export interface CustomerServicePrice {
  id: string
  customer_id: string
  service_id: string
  harga_custom: number | null
  created_at: string
  updated_at: string
  services?: Service
}

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
  // Kolom service (migration)
  service_id?: string | null
  service_nama?: string
  jumlah?: number
  satuan_label?: string
  harga_satuan?: number
  services?: Service
  // Kolom pengantaran (migration)
  pengantaran?: 'ditempat' | 'antar_jemput'
  ongkir?: number
  // Kolom pembayaran (migration)
  metode_pembayaran?: PaymentMethod
  status_pembayaran?: PaymentStatus
  // Kolom foto penimbangan (migration)
  foto_penimbangan_url?: string | null
}

export interface Settings {
  id: number
  nama_toko: string
  alamat: string
  no_hp: string
  harga_perkg: number
  minimum_kg: number
}