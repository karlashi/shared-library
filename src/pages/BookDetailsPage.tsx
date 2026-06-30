import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBook, useProfile, useProfiles, useBookLoan, useLendBook, useReturnBook } from '../services/queries'

export function BookDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { user } = useAuth()
  const { data: book, isLoading: isBookLoading } = useBook(id)
  const { data: owner } = useProfile(book?.owner_id)
  const { data: loan } = useBookLoan(id)
  const { data: borrower } = useProfile(loan?.borrower_id)
  const { data: users = [] } = useProfiles()
  const lendBook = useLendBook()
  const returnBook = useReturnBook()

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

  return (
    <div style={{ padding: 20 }}>

      {/* BACK */}
      <button onClick={() => navigate('/')}>
        ← Volver
      </button>

      {/* MAIN LAYOUT */}
      <div
        style={{
          display: 'flex',
          gap: 30,
          marginTop: 20,
          flexWrap: 'wrap'
        }}
      >

        {/* LEFT: COVER */}
        <div style={{ minWidth: 240 }}>
          {book.cover_url && (
            <img
              src={book.cover_url}
              style={{
                width: 220,
                borderRadius: 8
              }}
            />
          )}
        </div>

        {/* RIGHT: INFO */}
        <div style={{ flex: 1, minWidth: 250 }}>

          <h1>{book.title}</h1>
          <p>{book.author}</p>

          {/* EDIT */}
          {isOwner && (
            <button
              onClick={() => navigate(`/book/${id}/edit`)}
              style={{ marginTop: 10 }}
            >
              Editar libro ✏️
            </button>
          )}

          {/* OWNER */}
          <p style={{ marginTop: 15 }}>
            👤 <b>Propietario:</b> {ownerName}
          </p>

          {/* BORROWER */}
          <p>
            📕 <b>Prestado a:</b> {borrowerName || 'Nadie'}
          </p>

          {/* STATUS */}
          <div style={{ marginTop: 10 }}>
            {status === 'available' && (
              <span style={{
                background: '#d1fae5',
                color: '#065f46',
                padding: '4px 8px',
                borderRadius: 6
              }}>
                🟢 Disponible
              </span>
            )}

            {status === 'borrowed' && (
              <span style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '4px 8px',
                borderRadius: 6
              }}>
                🔴 Prestado
              </span>
            )}

            {status === 'blocked' && (
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '4px 8px',
                borderRadius: 6
              }}>
                🟡 Fuera de circulación
              </span>
            )}
          </div>

          {/* OWNER LENDING / RETURN CONTROL */}
          {isOwner && (
            <div style={{ marginTop: 20 }}>
              {isBorrowed ? (
                <button onClick={markAsReturned} disabled={returnBook.isPending}>
                  Marcar como devuelto
                </button>
              ) : (
                <>
                  <h4>Prestar a usuario</h4>

                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    style={{ padding: 6, width: '100%' }}
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
                    style={{ marginTop: 8 }}
                  >
                    Prestar 📖
                  </button>
                </>
              )}
            </div>
          )}

          {/* EXTRA INFO */}
          <div style={{ marginTop: 15 }}>
            <p><b>Colección:</b> {book.collection}</p>
            <p><b>Edad recomendada:</b> {book.age_recommendation}</p>

            {book.tags && (
              <p><b>Etiquetas:</b> {book.tags.join(', ')}</p>
            )}

            {book.link && (
              <p>
                🔗 <a href={book.link} target="_blank">
                  Ver enlace
                </a>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}