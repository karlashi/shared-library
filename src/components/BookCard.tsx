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
    <div className="rounded-lg border border-gray-200 p-3 shadow-sm">
      {/* CLICK CARD */}
      <div onClick={() => navigate(`/book/${book.id}`)} className="cursor-pointer">
        <h4 className="font-semibold text-gray-900 truncate">{book.title}</h4>
        <p className="text-sm text-gray-600 truncate">{book.author}</p>

        {book.cover_url && (
          <img
            src={book.cover_url}
            className="mt-2 w-full rounded-md aspect-[2/3] object-cover"
          />
        )}
      </div>

      {/* BORROWED STATUS */}
      {book.isBorrowed && (
        <p className="mt-2 text-xs text-gray-600">
          📕 Prestado a: {borrowerName}
        </p>
      )}

      {/* OWNER LEND / RETURN CONTROL */}
      {isOwner && (
        <div className="mt-2">
          {book.isBorrowed ? (
            <button
              onClick={markAsReturned}
              disabled={returnBook.isPending}
              className="w-full rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200 disabled:opacity-50"
            >
              Marcar como devuelto
            </button>
          ) : (
            <>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
                className="mt-1.5 w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
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