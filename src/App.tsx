import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabaseClient'
import { getBooks } from './services/books'
import { getProfile } from './services/profiles'
import type { Book } from './types/Book'
import { BookCard } from './components/BookCard'
import { AddBookPage } from './pages/AddBookPage'
import { BookDetailsPage } from './pages/BookDetailsPage'
import { EditBookPage } from './pages/EditBookPage'

function Home() {
  const [books, setBooks] = useState<Book[]>([])

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 👤 AUTH LOADER
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser()

    const user = data.user
    setUser(user)

    if (user) {
      const profileData = await getProfile(user.id)
      setProfile(profileData)
    }
  }

  // 📚 LOAD BOOKS
  const loadBooks = async () => {
    const data = await getBooks()
    setBooks(data)
  }

  useEffect(() => {
    loadUser()
    loadBooks()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>📚 Biblioteca Compartida</h1>

      {/* USER INFO */}
      <div style={{ marginBottom: 10 }}>
        {profile ? (
          <>
            <p>👤 {profile.name}</p>
            <button onClick={logout}>Cerrar sesión</button>
          </>
        ) : (
          <p>🔐 No hay sesión iniciada</p>
        )}
      </div>

      <Link to="/add">
        <button>➕ Añadir libro</button>
      </Link>

      {/* SEARCH + FILTERS */}
      <div style={{ marginTop: 20, marginBottom: 20 }}>

        <input
          placeholder="Buscar por título o autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 8,
            width: 260,
            marginRight: 10
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="all">Todos</option>
          <option value="available">Disponibles</option>
          <option value="borrowed">Prestados</option>
          <option value="blocked">Fuera de circulación</option>
        </select>

      </div>

      {/* BOOK GRID */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        {books
          .filter(book => {
            const matchesSearch =
              book.title.toLowerCase().includes(search.toLowerCase()) ||
              book.author.toLowerCase().includes(search.toLowerCase())

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
          .map(book => (
            <BookCard
              key={book.id}
              book={book}
              onAction={loadBooks}
            />
          ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddBookPage />} />
        <Route path="/book/:id" element={<BookDetailsPage />} />
        <Route path="/book/:id/edit" element={<EditBookPage />} />
      </Routes>
    </BrowserRouter>
  )
}