import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { getProfile } from '../services/profiles'
import { useNavigate } from 'react-router-dom'

export function BookCard({ book, onAction }: any) {
  const navigate = useNavigate()

  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')

      setUsers(profiles || [])
    }

    load()
  }, [])

  const isOwner = book.owner_id === user?.id

  const lendToUser = async () => {
    if (!selectedUser) return alert('Selecciona un usuario')

    const { error } = await supabase.from('loans').insert({
      book_id: book.id,
      borrower_id: selectedUser
    })

    if (error) {
      console.error(error)
      return alert('Error al prestar')
    }

    alert('Libro prestado')
    onAction?.()
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

      {/* OWNER LEND CONTROL */}
      {isOwner && (
        <div style={{ marginTop: 10 }}>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ width: '100%', marginTop: 6 }}
          >
            <option value="">Prestar a...</option>

            {users.map((u) => (
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
        </div>
      )}
    </div>
  )
}