import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabaseClient'
import { getBooks } from './services/books'
import { getProfile } from './services/profiles'
import type { Book } from './types/Books'
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

  // 👤 Load logged-in user
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    if (user) {
      const profileData = await getProfile(user.id)
      setProfile(profileData)
    } else {
      setProfile(null)
    }
  }

  // 📚 Load books
  const loadBooks = async () => {
    const data = await getBooks()
    setBooks(data)
  }

  useEffect(() => {
    loadUser()
    loadBooks()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const filteredBooks = books.filter((book) => {
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

  return (
    <div style={{ padding: 20 }}>
      <h1>📚 Biblioteca Compartida</h1>

      {/* USER */}
      <div style={{ marginBottom: 15 }}>
        {user && profile ? (
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

      {/* SEARCH + FILTER */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 20,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <input
          placeholder="Buscar por título o autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 8,
            width: 260,
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
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {filteredBooks.map((book) => (
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