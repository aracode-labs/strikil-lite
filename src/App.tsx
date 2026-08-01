import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'

// Layout halaman
function Layout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  )
}

// Halaman placeholder sementara
function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </div>
  )
}

function DashboardPage() {
  return <Placeholder title="Dashboard" />
}

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
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}