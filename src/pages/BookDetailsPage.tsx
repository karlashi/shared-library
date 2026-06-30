import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { getProfile } from '../services/profiles'

export function BookDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [book, setBook] = useState<any>(null)
  const [ownerName, setOwnerName] = useState('')
  const [borrowerName, setBorrowerName] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      // 👤 current user
      const { data: auth } = await supabase.auth.getUser()
      setUser(auth.user)

      // 📚 book
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      setBook(data)

      // 👤 owner
      if (data.owner_id) {
        const owner = await getProfile(data.owner_id)
        setOwnerName(owner?.name || 'Desconocido')
      }

      // 📕 current borrower
      const { data: loan } = await supabase
        .from('loans')
        .select('*')
        .eq('book_id', id)
        .is('returned_at', null)
        .maybeSingle()

      if (loan?.borrower_id) {
        const borrower = await getProfile(loan.borrower_id)
        setBorrowerName(borrower?.name || 'Desconocido')
      }

      // 👥 users list (for owner lending)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')

      setUsers(profiles || [])

      setLoading(false)
    }

    load()
  }, [id])

  if (loading) return <p>Cargando...</p>
  if (!book) return <p>Libro no encontrado</p>

  const isBorrowed = !!borrowerName
  const isBlocked = book.status === 'Fuera de circulación'
  const isOwner = book.owner_id === user?.id

  const getStatus = () => {
    if (isBlocked) return 'blocked'
    if (isBorrowed) return 'borrowed'
    return 'available'
  }

  const status = getStatus()

  const lendToUser = async () => {
    if (!selectedUser) return alert('Selecciona un usuario')

    const { error } = await supabase.from('loans').insert({
      book_id: id,
      borrower_id: selectedUser
    })

    if (error) {
      console.error(error)
      return alert('Error al prestar libro')
    }

    alert('Libro prestado correctamente')
    window.location.reload()
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
          <button
            onClick={() => navigate(`/book/${id}/edit`)}
            style={{ marginTop: 10 }}
          >
            Editar libro ✏️
          </button>

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

          {/* OWNER LENDING CONTROL */}
          {isOwner && (
            <div style={{ marginTop: 20 }}>

              <h4>Prestar a usuario</h4>

              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ padding: 6, width: '100%' }}
              >
                <option value="">Selecciona usuario</option>

                {users.map((u) => (
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