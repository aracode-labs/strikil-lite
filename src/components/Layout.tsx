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
      {/* Header dengan gradient seamless */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow">
        <div className="mx-auto flex max-w-2xl lg:max-w-4xl xl:max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Strikil Lite" className="h-8 w-8 rounded-full object-contain" />
            <span className="text-sm font-bold leading-tight">STRIKIL<br/>Setrika Kiloan Cimahi</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-orange-700 px-3 py-1.5 text-sm font-medium hover:bg-orange-800"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Floating Action Button (kanan bawah, naik saat bottom sheet terbuka) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-2xl text-white shadow-lg transition-all duration-300 hover:bg-orange-700 ${
          menuOpen ? 'bottom-[340px] right-6' : 'bottom-6 right-6'
        }`}
        aria-label="Menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Bottom Sheet Navigator */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30 bg-black/50 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-white shadow-2xl animate-slide-up">
            {/* Handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-300" />
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-bold text-gray-800">Menu</h3>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Tutup"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2 px-4 pb-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-medium transition ${
                      isActive
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-2xl">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Konten */}
      <main className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-6xl px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}