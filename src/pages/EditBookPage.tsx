import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useBook, useAllTags, useDeleteBook } from '../services/queries'
import { validateImageFile, uploadCoverImage, deleteCoverImage } from '../services/storage'
import { TagInput } from '../components/TagInput'

type FormValues = {
  title: string
  author: string
  description: string
  isbn: string
  collection: string
  age_recommendation: string
  link: string
  tags: string[]
}

export function EditBookPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: book, isLoading } = useBook(id)
  const { data: allTags = [] } = useAllTags()
  const deleteBook = useDeleteBook()

  const [cover_url, setCoverUrl] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '', author: '', description: '', isbn: '',
      collection: '', age_recommendation: '', link: '', tags: [],
    },
  })

  useEffect(() => {
    if (!book) return

    reset({
      title: book.title,
      author: book.author,
      description: book.description || '',
      isbn: book.isbn || '',
      collection: book.collection || '',
      age_recommendation: book.age_recommendation || '',
      link: book.link || '',
      tags: book.tags || [],
    })
    setCoverUrl(book.cover_url || '')
  }, [book, reset])

  const updateBook = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase
        .from('books')
        .update({
          title: values.title,
          author: values.author,
          description: values.description,
          isbn: values.isbn,
          cover_url,
          collection: values.collection,
          age_recommendation: values.age_recommendation,
          link: values.link,
          tags: values.tags
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

  const onSubmit = (values: FormValues) => {
    updateBook.mutate(values)
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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Título</span>
            <input
              {...register('title', { required: 'El título es obligatorio' })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Autor</span>
            <input
              {...register('author')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Descripción</span>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">ISBN</span>
            <input
              {...register('isbn')}
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
              {...register('collection')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Edad recomendada</span>
            <input
              {...register('age_recommendation')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Link</span>
            <input
              {...register('link')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Etiquetas</span>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} suggestions={allTags} />
              )}
            />
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