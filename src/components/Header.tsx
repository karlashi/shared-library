import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/profile', label: 'Mi perfil' },
  { to: '/stats', label: 'Estadísticas' },
  { to: '/changelog', label: 'Novedades' },
  { to: '/about', label: 'Acerca de' },
]

export function Header() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const logout = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          📚 Biblioteca Compartida
        </Link>
        <Link to="/login">
          <button className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200">
            Iniciar sesión
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link to="/" className="whitespace-nowrap text-xl font-semibold text-gray-900">
        📚 Biblioteca Compartida
      </Link>

      {/* Desktop nav */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <p className="mr-1 whitespace-nowrap text-gray-700">👤 {profile?.name ?? user?.email}</p>
        {navItems.map((item) => (
          <Link key={item.to} to={item.to}>
            <button className="whitespace-nowrap rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200">
              {item.label}
            </button>
          </Link>
        ))}
        <button
          onClick={logout}
          className="whitespace-nowrap rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Mobile burger */}
      <div className="relative sm:hidden">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Abrir menú"
          className="rounded-md bg-gray-100 px-3 py-2 text-lg text-gray-800 hover:bg-gray-200"
        >
          ☰
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-gray-200 bg-white p-2 shadow-md">
              <p className="mb-2 px-2 text-sm text-gray-600">👤 {profile?.name ?? user?.email}</p>
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                  <div className="rounded-md px-2 py-2 text-gray-800 hover:bg-gray-100">
                    {item.label}
                  </div>
                </Link>
              ))}
              <button
                onClick={logout}
                className="mt-1 w-full rounded-md px-2 py-2 text-left text-gray-800 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
