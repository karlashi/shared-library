import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useBook,
  useProfile,
  useProfiles,
  useBookLoan,
  useLendBook,
  useReturnBook,
  useBookTags,
  useAllTags,
  useAddTag,
  useRemoveTag,
} from '../services/queries'
import { TagInput } from '../components/TagInput'

export function BookDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { user } = useAuth()
  const { data: book, isLoading: isBookLoading } = useBook(id)
  const { data: owner } = useProfile(book?.owner_id)
  const { data: loan } = useBookLoan(id)
  const { data: borrower } = useProfile(loan?.borrower_id)
  const { data: users = [] } = useProfiles()
  const { data: bookTags = [] } = useBookTags(id)
  const { data: allTags = [] } = useAllTags()
  const lendBook = useLendBook()
  const returnBook = useReturnBook()
  const addTag = useAddTag()
  const removeTag = useRemoveTag()

  const [selectedUser, setSelectedUser] = useState('')

  if (isBookLoading) return <p>Cargando...</p>
  if (!book) return <p>Libro no encontrado</p>

  const ownerName = owner?.name || 'Desconocido'
  const borrowerName = loan ? borrower?.name || 'Desconocido' : null

  const isBorrowed = !!borrowerName
  const isBlocked = book.status === 'Fuera de circulación'
  const isOwner = book.owner_id === user?.id

  const getStatus = () => {
    if (isBlocked) return 'blocked'
    if (isBorrowed) return 'borrowed'
    return 'available'
  }

  const status = getStatus()

  const lendToUser = () => {
    if (!selectedUser || !id) return alert('Selecciona un usuario')

    lendBook.mutate(
      { bookId: id, borrowerId: selectedUser },
      {
        onSuccess: () => alert('Libro prestado correctamente'),
        onError: (error) => {
          console.error(error)
          alert('Error al prestar libro')
        },
      }
    )
  }

  const markAsReturned = () => {
    if (!loan) return

    returnBook.mutate(loan.id, {
      onError: (error) => {
        console.error(error)
        alert('Error al marcar el libro como devuelto')
      },
    })
  }

  const tagNames = bookTags.map((t) => t.tag)

  const canRemoveTag = (tag: string) => {
    const row = bookTags.find((t) => t.tag === tag)
    if (!row) return false
    return isOwner || row.added_by === user?.id
  }

  const handleTagsChange = (newTags: string[]) => {
    if (!id || !user) return

    const added = newTags.find((t) => !tagNames.includes(t))
    if (added) {
      addTag.mutate(
        { bookId: id, tag: added, userId: user.id },
        {
          onError: (error) => {
            console.error(error)
            alert('Error al añadir la etiqueta')
          },
        }
      )
      return
    }

    const removed = tagNames.find((t) => !newTags.includes(t))
    if (removed) {
      removeTag.mutate(
        { bookId: id, tag: removed },
        {
          onError: (error) => {
            console.error(error)
            alert('Error al eliminar la etiqueta')
          },
        }
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* BACK */}
        <button
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          ← Volver
        </button>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col gap-6 md:flex-row">
          {/* LEFT: COVER */}
          <div className="md:w-56 md:shrink-0">
            {book.cover_url && (
              <img src={book.cover_url} className="w-40 rounded-lg sm:w-56 md:w-full" />
            )}
          </div>

          {/* RIGHT: INFO */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{book.title}</h1>
            <p className="text-gray-600">{book.author}</p>

            {/* EDIT */}
            {isOwner && (
              <button
                onClick={() => navigate(`/book/${id}/edit`)}
                className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200"
              >
                Editar libro ✏️
              </button>
            )}

            {/* OWNER */}
            <p className="mt-4 text-gray-700">
              👤 <b>Propietario:</b> {ownerName}
            </p>

            {/* BORROWER */}
            <p className="text-gray-700">
              📕 <b>Prestado a:</b> {borrowerName || 'Nadie'}
            </p>

            {/* STATUS */}
            <div className="mt-3">
              {status === 'available' && (
                <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
                  🟢 Disponible
                </span>
              )}

              {status === 'borrowed' && (
                <span className="rounded-md bg-red-100 px-2 py-1 text-red-800">
                  🔴 Prestado
                </span>
              )}

              {status === 'blocked' && (
                <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-800">
                  🟡 Fuera de circulación
                </span>
              )}
            </div>

            {/* LISTING (GIFT/SALE) STATUS */}
            {book.listing_type && (
              <div className="mt-3">
                <span
                  className={
                    book.listing_type === 'gift'
                      ? 'rounded-md bg-purple-100 px-2 py-1 text-purple-800'
                      : 'rounded-md bg-amber-100 px-2 py-1 text-amber-800'
                  }
                >
                  {book.listing_type === 'gift' ? '🎁 Para regalar' : '💰 En venta'}
                </span>
                {book.listing_comment && (
                  <p className="mt-1 text-sm text-gray-600">{book.listing_comment}</p>
                )}
              </div>
            )}

            {/* OWNER LENDING / RETURN CONTROL */}
            {isOwner && (
              <div className="mt-5">
                {isBorrowed ? (
                  <button
                    onClick={markAsReturned}
                    disabled={returnBook.isPending}
                    className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Marcar como devuelto
                  </button>
                ) : (
                  <>
                    <h4 className="mb-2 font-medium text-gray-900">Prestar a usuario</h4>

                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Selecciona usuario</option>

                      {users.filter((u) => u.id !== user?.id).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={lendToUser}
                      className="mt-2 rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
                    >
                      Prestar 📖
                    </button>
                  </>
                )}
              </div>
            )}

            {/* EXTRA INFO */}
            <div className="mt-4 space-y-1 text-gray-700">
              {book.description && (
                <p className="mb-2 whitespace-pre-line">{book.description}</p>
              )}

              <p><b>Colección:</b> {book.collection}</p>
              <p><b>Edad recomendada:</b> {book.age_recommendation}</p>

              {book.isbn && (
                <p><b>ISBN:</b> {book.isbn}</p>
              )}

              <div>
                <b>Etiquetas:</b>
                <div className="mt-1 max-w-sm">
                  <TagInput
                    value={tagNames}
                    onChange={handleTagsChange}
                    suggestions={allTags}
                    canRemove={canRemoveTag}
                  />
                </div>
              </div>

              {book.link && (
                <p>
                  🔗 <a href={book.link} target="_blank" className="text-brand hover:underline">
                    Ver enlace
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}