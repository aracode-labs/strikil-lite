import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/order-baru', label: 'Order Baru', icon: '➕' },
  { to: '/order-aktif', label: 'Order Aktif', icon: '📋' },
  { to: '/riwayat', label: 'Riwayat', icon: '🕘' },
  { to: '/pelanggan', label: 'Pelanggan', icon: '👥' },
  { to: '/pengaturan', label: 'Pengaturan', icon: '⚙️' },
]

export default function Layout() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-blue-600 text-white shadow">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">STRIKIL LITE</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium hover:bg-blue-800"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Konten */}
      <main className="mx-auto max-w-3xl px-4 py-4">
        <Outlet />
      </main>

      {/* Navigasi bawah (HP) */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white md:hidden">
        <div className="grid grid-cols-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Navigasi atas (desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 hidden border-t border-gray-200 bg-white md:block">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}