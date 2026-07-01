import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useBooks } from './services/queries'
import { BookCard } from './components/BookCard'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { AboutPage } from './pages/AboutPage'
import { ProfilePage } from './pages/ProfilePage'
import { AddBookPage } from './pages/AddBookPage'
import { BookDetailsPage } from './pages/BookDetailsPage'
import { EditBookPage } from './pages/EditBookPage'

function Home() {
  const { user, profile, signOut } = useAuth()
  const { data: books = [] } = useBooks()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent')

  const logout = async () => {
    await signOut()
  }

  const filteredBooks = books
    .filter((book) => {
      const searchTerm = search.toLowerCase()
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.tags ?? []).some((tag) => tag.includes(searchTerm))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' &&
          !book.isBorrowed &&
          book.status !== 'Fuera de circulación') ||
        (statusFilter === 'borrowed' && book.isBorrowed) ||
        (statusFilter === 'blocked' &&
          book.status === 'Fuera de circulación')

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'es')
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-5">📚 Biblioteca Compartida</h1>

        {/* USER + NAV */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <p className="text-gray-700">👤 {profile?.name ?? user?.email}</p>
          <div className="flex gap-2">
            <Link to="/profile">
              <button className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200">
                Mi perfil
              </button>
            </Link>
            <Link to="/about">
              <button className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200">
                Acerca de
              </button>
            </Link>
            <button
              onClick={logout}
              className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <Link to="/add">
          <button className="mb-6 rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90">
            ➕ Añadir libro
          </button>
        </Link>

        {/* SEARCH + FILTER */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            placeholder="Buscar por título, autor o etiqueta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="borrowed">Prestados</option>
            <option value="blocked">Fuera de circulación</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="recent">Más recientes</option>
            <option value="title">Título (A-Z)</option>
          </select>
        </div>

        {/* BOOK GRID */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/add" element={<RequireAuth><AddBookPage /></RequireAuth>} />
          <Route path="/book/:id" element={<RequireAuth><BookDetailsPage /></RequireAuth>} />
          <Route path="/book/:id/edit" element={<RequireAuth><EditBookPage /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}