import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfiles, useLendBook, useReturnBook } from '../services/queries'
import type { Book } from '../types/Books'

export function BookCard({ book }: { book: Book }) {
  const navigate = useNavigate()

  const { user } = useAuth()
  const { data: users = [] } = useProfiles()
  const lendBook = useLendBook()
  const returnBook = useReturnBook()
  const [selectedUser, setSelectedUser] = useState('')

  const isOwner = book.owner_id === user?.id
  const borrowerName = users.find((u) => u.id === book.borrowedBy)?.name ?? 'alguien'

  const lendToUser = () => {
    if (!selectedUser) return alert('Selecciona un usuario')

    lendBook.mutate(
      { bookId: book.id, borrowerId: selectedUser },
      {
        onSuccess: () => alert('Libro prestado'),
        onError: (error) => {
          console.error(error)
          alert('Error al prestar')
        },
      }
    )
  }

  const markAsReturned = () => {
    if (!book.loanId) return

    returnBook.mutate(book.loanId, {
      onError: (error) => {
        console.error(error)
        alert('Error al marcar el libro como devuelto')
      },
    })
  }

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: 10,
        width: 180,
        borderRadius: 8
      }}
    >

      {/* CLICK CARD */}
      <div onClick={() => navigate(`/book/${book.id}`)}>
        <h4>{book.title}</h4>
        <p>{book.author}</p>

        {book.cover_url && (
          <img
            src={book.cover_url}
            style={{ width: '100%', borderRadius: 6 }}
          />
        )}
      </div>

      {/* BORROWED STATUS */}
      {book.isBorrowed && (
        <p style={{ marginTop: 10, fontSize: 13 }}>
          📕 Prestado a: {borrowerName}
        </p>
      )}

      {/* OWNER LEND / RETURN CONTROL */}
      {isOwner && (
        <div style={{ marginTop: 10 }}>
          {book.isBorrowed ? (
            <button
              onClick={markAsReturned}
              disabled={returnBook.isPending}
              style={{ width: '100%' }}
            >
              Marcar como devuelto
            </button>
          ) : (
            <>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
              >
                <option value="">Prestar a...</option>

                {users.filter((u) => u.id !== user?.id).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <button
                onClick={lendToUser}
                style={{ width: '100%', marginTop: 6 }}
              >
                Prestar 📖
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}