import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useBook, useAllTags, useDeleteBook } from '../services/queries'
import { validateImageFile, uploadCoverImage, deleteCoverImage } from '../services/storage'
import { TagInput } from '../components/TagInput'

export function EditBookPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: book, isLoading } = useBook(id)
  const { data: allTags = [] } = useAllTags()
  const deleteBook = useDeleteBook()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [isbn, setIsbn] = useState('')
  const [cover_url, setCoverUrl] = useState('')
  const [collection, setCollection] = useState('')
  const [age_recommendation, setAge] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (!book) return

    setTitle(book.title)
    setAuthor(book.author)
    setDescription(book.description || '')
    setIsbn(book.isbn || '')
    setCoverUrl(book.cover_url || '')
    setCollection(book.collection || '')
    setAge(book.age_recommendation || '')
    setLink(book.link || '')
    setTags(book.tags || [])
  }, [book])

  const updateBook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('books')
        .update({
          title,
          author,
          description,
          isbn,
          cover_url,
          collection,
          age_recommendation,
          link,
          tags
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      navigate(`/book/${id}`)
    },
    onError: () => alert('Error al actualizar libro'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateBook.mutate()
  }

  const handleDelete = () => {
    if (!id) return
    if (!window.confirm('¿Seguro que quieres eliminar este libro? Esta acción no se puede deshacer.')) {
      return
    }

    deleteBook.mutate(
      { bookId: id, coverUrl: cover_url },
      {
        onSuccess: () => {
          alert('Libro eliminado')
          navigate('/')
        },
        onError: (error) => {
          console.error(error)
          alert(error instanceof Error ? error.message : 'Error al eliminar el libro')
        },
      }
    )
  }

  if (isLoading || !book) return <p>Cargando...</p>
  if (book.owner_id !== user?.id) return <Navigate to={`/book/${id}`} replace />

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h1>Editar libro</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        <label>
          Título
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <label>
          Autor
          <input value={author} onChange={e => setAuthor(e.target.value)} />
        </label>

        <label>
          Descripción
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
        </label>

        <label>
          ISBN
          <input value={isbn} onChange={e => setIsbn(e.target.value)} />
        </label>

<label>
  Portada (imagen)

  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validationError = validateImageFile(file)
      if (validationError) {
        alert(validationError)
        e.target.value = ''
        return
      }

      const previousCoverUrl = cover_url

      try {
        const newCoverUrl = await uploadCoverImage(file)
        setCoverUrl(newCoverUrl)

        if (previousCoverUrl) {
          await deleteCoverImage(previousCoverUrl)
        }
      } catch (err) {
        console.error(err)
        alert('Error subiendo imagen')
      }
    }}
  />

  {/* preview */}
  {cover_url && (
    <img
      src={cover_url}
      style={{ width: 120, marginTop: 10, borderRadius: 6 }}
    />
  )}
</label>

        <label>
          Colección
          <input value={collection} onChange={e => setCollection(e.target.value)} />
        </label>

        <label>
          Edad recomendada
          <input value={age_recommendation} onChange={e => setAge(e.target.value)} />
        </label>

        <label>
          Link
          <input value={link} onChange={e => setLink(e.target.value)} />
        </label>

        <label>
          Etiquetas
          <TagInput value={tags} onChange={setTags} suggestions={allTags} />
        </label>

        <button type="submit" disabled={updateBook.isPending}>
          {updateBook.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <button type="button" onClick={() => navigate(-1)}>
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteBook.isPending}
          style={{ color: '#991b1b' }}
        >
          {deleteBook.isPending ? 'Eliminando...' : 'Eliminar libro 🗑️'}
        </button>
      </form>
    </div>
  )
}