import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useBooks } from './services/queries'
import { BookCard } from './components/BookCard'
import { RequireAuth } from './components/RequireAuth'
import { Header } from './components/Header'
import { BackToTop } from './components/BackToTop'
import { LoginPage } from './pages/LoginPage'
import { AboutPage } from './pages/AboutPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'
import { AddBookPage } from './pages/AddBookPage'
import { BookDetailsPage } from './pages/BookDetailsPage'
import { EditBookPage } from './pages/EditBookPage'

function Home() {
  const { data: books = [] } = useBooks()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent')

  const filteredBooks = books
    .filter((book) => !book.archived)
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
        <Header />

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
          <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
          <Route path="/add" element={<RequireAuth><AddBookPage /></RequireAuth>} />
          <Route path="/book/:id" element={<RequireAuth><BookDetailsPage /></RequireAuth>} />
          <Route path="/book/:id/edit" element={<RequireAuth><EditBookPage /></RequireAuth>} />
        </Routes>
        <BackToTop />
      </BrowserRouter>
    </AuthProvider>
  )
}