import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { lookupByIsbn } from '../services/googleBooks'
import { validateImageFile, uploadCoverImage } from '../services/storage'
import { useAllTags } from '../services/queries'
import { TagInput } from '../components/TagInput'

export function AddBookPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: allTags = [] } = useAllTags()

  const [isbn, setIsbn] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupCoverUrl, setLookupCoverUrl] = useState('')

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [collection, setCollection] = useState('')
  const [link, setLink] = useState('')
  const [age, setAge] = useState('')
  const [tags, setTags] = useState<string[]>([])
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

  const addBook = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Debes iniciar sesión')

      const coverUrl = file ? await uploadCoverImage(file) : lookupCoverUrl

      const { error } = await supabase.from('books').insert({
        title,
        author,
        description,
        isbn,
        collection,
        link,
        age_recommendation: age,
        tags,
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          ← Volver a la biblioteca
        </button>
        <h1 className="mb-5 text-2xl font-semibold text-gray-900">➕ Añadir libro</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">ISBN</span>
            <div className="flex gap-2">
              <input
                value={isbn}
                onChange={e => setIsbn(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={handleIsbnLookup}
                disabled={isLookingUp}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
              >
                {isLookingUp ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </label>

          {lookupCoverUrl && (
            <img src={lookupCoverUrl} className="w-24 rounded-md" />
          )}

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
            <span className="mb-1 block text-sm font-medium text-gray-700">Colección</span>
            <input
              value={collection}
              onChange={e => setCollection(e.target.value)}
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
            <span className="mb-1 block text-sm font-medium text-gray-700">Edad recomendada</span>
            <input
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Etiquetas</span>
            <TagInput value={tags} onChange={setTags} suggestions={allTags} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Portada</span>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const selected = e.target.files?.[0]
                if (!selected) return

                const validationError = validateImageFile(selected)
                if (validationError) {
                  alert(validationError)
                  e.target.value = ''
                  return
                }

                setFile(selected)
              }}
              className="block w-full text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={addBook.isPending}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {addBook.isPending ? 'Guardando...' : 'Guardar libro'}
          </button>
        </form>
      </div>
    </div>
  )
}