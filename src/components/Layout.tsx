import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase, getLogoUrl } from '../lib/supabase'
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  History,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Home,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/order-baru', label: 'Order Baru', icon: PlusCircle },
  { to: '/order-aktif', label: 'Order Aktif', icon: ClipboardList },
  { to: '/riwayat', label: 'Riwayat', icon: History },
  { to: '/pelanggan', label: 'Pelanggan', icon: Users },
  { to: '/jasa', label: 'Jasa & Tarif', icon: Wallet },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
  { to: '/login', label: 'Keluar', icon: LogOut, isLogout: true },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/'

  async function handleLogout() {
    const yakin = confirm('Yakin ingin keluar dari aplikasi?')
    if (!yakin) return

    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleBack() {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header dengan gradient seamless */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow">
        <div className="mx-auto flex max-w-2xl lg:max-w-4xl xl:max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {!isDashboard && (
              <button
                onClick={handleBack}
                className="mr-1 rounded-lg p-1.5 text-white/90 transition hover:bg-orange-700 hover:text-white"
                aria-label="Kembali"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <img src={getLogoUrl()} alt="Strikil Lite" className="h-8 w-8 rounded-full object-contain" />
            <span className="text-sm font-bold leading-tight">STRIKIL<br/>Setrika Kiloan Cimahi</span>
          </div>
          {!isDashboard && (
            <button
              onClick={() => navigate('/')}
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-orange-700 hover:text-white"
              aria-label="Ke Dashboard"
            >
              <Home size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Floating Action Button (kanan bawah, naik saat bottom sheet terbuka) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-all duration-300 hover:bg-orange-700 ${
          menuOpen ? 'bottom-[340px] right-6' : 'bottom-6 right-6'
        }`}
        aria-label="Menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
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
                <X size={20} />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2 px-4 pb-6">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => {
                      if (item.isLogout) {
                        handleLogout()
                      }
                      setMenuOpen(false)
                    }}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-sm font-medium transition ${
                        isActive
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : item.isLogout
                            ? 'border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon size={22} strokeWidth={2} />
                    {item.label}
                  </NavLink>
                )
              })}
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