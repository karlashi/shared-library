import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useBooks,
  useProfiles,
  useAllLoans,
  useUpdateProfile,
  useReturnBook,
} from '../services/queries'
import { BookCard } from '../components/BookCard'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const { data: books = [] } = useBooks()
  const { data: profiles = [] } = useProfiles()
  const { data: loans = [] } = useAllLoans()

  const updateProfile = useUpdateProfile()
  const returnBook = useReturnBook()

  const [name, setName] = useState(profile?.name ?? '')

  const getBookById = (id: string) => books.find((b) => b.id === id)
  const getProfileName = (id: string) =>
    profiles.find((p) => p.id === id)?.name ?? 'Desconocido'

  const myBooks = books.filter((b) => b.owner_id === user?.id)

  const borrowedByMe = loans.filter((l) => l.borrower_id === user?.id)

  const lentByMe = loans.filter((l) => getBookById(l.book_id)?.owner_id === user?.id)

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    updateProfile.mutate(
      { userId: user.id, name },
      {
        onError: (error) => {
          console.error(error)
          alert('Error al actualizar el perfil')
        },
      }
    )
  }

  const handleReturn = (loanId: string) => {
    returnBook.mutate(loanId, {
      onError: (error) => {
        console.error(error)
        alert('Error al marcar el libro como devuelto')
      },
    })
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        ← Volver
      </button>

      <h1>👤 Mi perfil</h1>

      {/* EDIT NAME */}
      <form onSubmit={handleSaveName} style={{ marginBottom: 30, maxWidth: 300 }}>
        <label>
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>
        <button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* MY BOOKS */}
      <h2>📚 Mis libros</h2>
      {myBooks.length === 0 ? (
        <p>Todavía no has añadido ningún libro.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
          {myBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {/* HISTORY: BORROWED BY ME */}
      <h2>📕 Libros que he pedido prestados</h2>
      {borrowedByMe.length === 0 ? (
        <p>No has pedido prestado ningún libro todavía.</p>
      ) : (
        <ul style={{ paddingLeft: 20, marginBottom: 30 }}>
          {borrowedByMe.map((loan) => {
            const book = getBookById(loan.book_id)
            return (
              <li key={loan.id} style={{ marginBottom: 6 }}>
                <b>{book?.title ?? 'Libro desconocido'}</b>
                {book && ` — ${book.author}`}
                {' · '}
                Propietario: {book ? getProfileName(book.owner_id ?? '') : 'Desconocido'}
                {' · '}
                {loan.returned_at ? 'Devuelto' : 'Activo'}
              </li>
            )
          })}
        </ul>
      )}

      {/* HISTORY: LENT BY ME */}
      <h2>📗 Libros que he prestado</h2>
      {lentByMe.length === 0 ? (
        <p>No has prestado ningún libro todavía.</p>
      ) : (
        <ul style={{ paddingLeft: 20 }}>
          {lentByMe.map((loan) => {
            const book = getBookById(loan.book_id)
            return (
              <li key={loan.id} style={{ marginBottom: 6 }}>
                <b>{book?.title ?? 'Libro desconocido'}</b>
                {' · '}
                Prestado a: {getProfileName(loan.borrower_id)}
                {' · '}
                {loan.returned_at ? (
                  'Devuelto'
                ) : (
                  <>
                    Activo{' '}
                    <button
                      onClick={() => handleReturn(loan.id)}
                      disabled={returnBook.isPending}
                      style={{ marginLeft: 8 }}
                    >
                      Marcar como devuelto
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
