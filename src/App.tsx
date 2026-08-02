
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pelanggan from './pages/Pelanggan'
import PelangganDetail from './pages/PelangganDetail'
import OrderBaru from './pages/OrderBaru'
import EStruk from './pages/EStruk'
import OrderAktif from './pages/OrderAktif'
import Riwayat from './pages/Riwayat'
import Pengaturan from './pages/Pengaturan'
import Progress from './pages/Progress'
import Jasa from './pages/Jasa'

function RedirectIfAuthed() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  return authed ? <Navigate to="/" replace /> : <Outlet />
}

function RequireAuth() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  return authed ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Route publik: lacak progress order & detail pelanggan (tanpa login) */}
      <Route path="/progress/:nomorOrder" element={<Progress />} />
      <Route path="/pelanggan/:hp" element={<PelangganDetail />} />

      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order-baru" element={<OrderBaru />} />
          <Route path="/order-aktif" element={<OrderAktif />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/pelanggan" element={<Pelanggan />} />
          <Route path="/jasa" element={<Jasa />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
          <Route path="/e-struk/:id" element={<EStruk />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}