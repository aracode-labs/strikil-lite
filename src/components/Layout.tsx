import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/order-baru', label: 'Order Baru', icon: '➕' },
  { to: '/order-aktif', label: 'Order Aktif', icon: '📋' },
  { to: '/riwayat', label: 'Riwayat', icon: '🕘' },
  { to: '/pelanggan', label: 'Pelanggan', icon: '👥' },
  { to: '/jasa', label: 'Jasa & Tarif', icon: '💰' },
  { to: '/pengaturan', label: 'Pengaturan', icon: '⚙️' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-orange-600 text-white shadow">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">STRIKIL LITE</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium hover:bg-orange-800"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Floating Menu Button (kanan atas) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="fixed top-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-xl text-white shadow-lg hover:bg-orange-700 md:top-4 md:right-4"
        aria-label="Menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <nav className="fixed inset-x-0 top-24 z-30 border-t border-orange-500 bg-orange-700 md:left-auto md:right-4 md:top-16 md:w-64 md:rounded-xl md:border">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                  isActive ? 'bg-orange-800 text-white' : 'text-orange-100 hover:bg-orange-600'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Konten */}
      <main className="mx-auto max-w-3xl px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}