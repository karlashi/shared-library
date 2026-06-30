import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { lookupByIsbn } from '../services/googleBooks'

export function AddBookPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isbn, setIsbn] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupCoverUrl, setLookupCoverUrl] = useState('')

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [collection, setCollection] = useState('')
  const [link, setLink] = useState('')
  const [age, setAge] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) return

    setIsLookingUp(true)
    try {
      const result = await lookupByIsbn(isbn.trim())

      if (!result) {
        alert('No se encontró ningún libro con ese ISBN. Completa los datos manualmente.')
        return
      }

      setTitle(result.title)
      setAuthor(result.author)
      setDescription(result.description)
      setLookupCoverUrl(result.coverUrl)
    } catch (err) {
      console.error(err)
      alert(
        err instanceof Error
          ? err.message
          : 'Error al buscar el libro. Intenta de nuevo o completa los datos manualmente.'
      )
    } finally {
      setIsLookingUp(false)
    }
  }

  const uploadImage = async (file: File) => {
    const fileName = `${crypto.randomUUID()}-${file.name}`

    const { error } = await supabase.storage
      .from('book-covers')
      .upload(fileName, file)

    if (error) throw error

    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const addBook = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Debes iniciar sesión')

      const coverUrl = file ? await uploadImage(file) : lookupCoverUrl

      const { error } = await supabase.from('books').insert({
        title,
        author,
        description,
        isbn,
        collection,
        link,
        age_recommendation: age,
        tags: tags.split(',').map(t => t.trim()),
        cover_url: coverUrl,
        owner_id: user.id,
        status: 'Disponible'
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      alert('Libro creado 📚')
      navigate('/')
    },
    onError: (err) => {
      console.error(err)
      alert(err instanceof Error && err.message === 'Debes iniciar sesión' ? err.message : 'Error al guardar el libro')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addBook.mutate()
  }

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
        <button
  type="button"
  onClick={() => navigate('/')}
  style={{
    marginBottom: 20,
    background: '#eee',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer'
  }}
>
  ← Volver a la biblioteca
</button>
      <h1>➕ Añadir libro</h1>

      <form onSubmit={handleSubmit}>

        <label>
          ISBN
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleIsbnLookup} disabled={isLookingUp}>
              {isLookingUp ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </label>

        {lookupCoverUrl && (
          <img
            src={lookupCoverUrl}
            style={{ width: 100, marginBottom: 10, borderRadius: 6 }}
          />
        )}

        <label>
          Título
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Autor
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Descripción
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Colección
          <input
            value={collection}
            onChange={e => setCollection(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Link
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Edad recomendada
          <input
            value={age}
            onChange={e => setAge(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Etiquetas (separadas por coma)
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Portada
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ marginBottom: 10 }}
          />
        </label>

        <button type="submit" disabled={addBook.isPending}>
          {addBook.isPending ? 'Guardando...' : 'Guardar libro'}
        </button>

      </form>
    </div>
  )
}