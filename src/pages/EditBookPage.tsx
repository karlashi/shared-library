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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <h1 className="mb-5 text-2xl font-semibold text-gray-900">Editar libro</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Título</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Autor</span>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Descripción</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">ISBN</span>
            <input
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Portada (imagen)</span>

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
              className="block w-full text-sm"
            />

            {/* preview */}
            {cover_url && (
              <img src={cover_url} className="mt-2 w-28 rounded-md" />
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Colección</span>
            <input
              value={collection}
              onChange={e => setCollection(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Edad recomendada</span>
            <input
              value={age_recommendation}
              onChange={e => setAge(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Link</span>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Etiquetas</span>
            <TagInput value={tags} onChange={setTags} suggestions={allTags} />
          </label>

          <button
            type="submit"
            disabled={updateBook.isPending}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {updateBook.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteBook.isPending}
            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteBook.isPending ? 'Eliminando...' : 'Eliminar libro 🗑️'}
          </button>
        </form>
      </div>
    </div>
  )
}