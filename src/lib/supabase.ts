import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL / Anon Key belum diisi. Salin .env.example menjadi .env dan isi nilainya.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

// Helper: ambil URL logo dari Supabase Storage bucket 'photos'
export function getLogoUrl() {
  const { data } = supabase.storage.from('photos').getPublicUrl('logo.png')
  return data.publicUrl
}
