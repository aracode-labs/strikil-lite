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
      {/* Header dengan hamburger */}
      <header className="sticky top-0 z-20 bg-blue-600 text-white shadow">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 hover:bg-blue-700"
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1 className="text-lg font-bold">STRIKIL LITE</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium hover:bg-blue-800"
          >
            Keluar
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <nav className="border-t border-blue-500 bg-blue-700">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-600'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Konten */}
      <main className="mx-auto max-w-3xl px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}