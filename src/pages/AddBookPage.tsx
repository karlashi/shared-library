import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { lookupByIsbn } from '../services/googleBooks'
import { validateImageFile, uploadCoverImage } from '../services/storage'
import { useAllTags } from '../services/queries'
import { TagInput } from '../components/TagInput'
import { BarcodeScannerModal } from '../components/BarcodeScannerModal'

type FormValues = {
  title: string
  author: string
  description: string
  isbn: string
  collection: string
  link: string
  age: string
  tags: string[]
}

export function AddBookPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: allTags = [] } = useAllTags()

  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupCoverUrl, setLookupCoverUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '', author: '', description: '', isbn: '',
      collection: '', link: '', age: '', tags: [],
    },
  })

  const handleIsbnLookup = async () => {
    const isbn = getValues('isbn').trim()
    if (!isbn) return

    setIsLookingUp(true)
    try {
      const result = await lookupByIsbn(isbn)

      if (!result) {
        alert(t('addBook.isbnNotFound'))
        return
      }

      setValue('title', result.title)
      setValue('author', result.author)
      setValue('description', result.description)
      setLookupCoverUrl(result.coverUrl)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : t('addBook.isbnLookupError'))
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleScanResult = (isbn: string) => {
    setShowScanner(false)
    setValue('isbn', isbn)
    handleIsbnLookup()
  }

  const addBook = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) throw new Error(t('addBook.mustBeLoggedIn'))

      const coverUrl = file ? await uploadCoverImage(file) : lookupCoverUrl

      const { data, error } = await supabase.from('books').insert({
        title: values.title,
        author: values.author,
        description: values.description,
        isbn: values.isbn,
        collection: values.collection,
        link: values.link,
        age_recommendation: values.age,
        cover_url: coverUrl,
        owner_id: user.id,
        status: 'Disponible'
      }).select('id').single()

      if (error) throw error

      if (values.tags.length > 0) {
        const rows = values.tags.map((tag) => ({ book_id: data.id, tag, added_by: user.id }))
        const { error: tagsError } = await supabase.from('book_tags').insert(rows)
        if (tagsError) throw tagsError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      alert(t('addBook.createdSuccess'))
      navigate('/')
    },
    onError: (err) => {
      console.error(err)
      alert(err instanceof Error && err.message === t('addBook.mustBeLoggedIn') ? err.message : t('addBook.saveError'))
    },
  })

  const onSubmit = (values: FormValues) => {
    addBook.mutate(values)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          {t('addBook.backToLibrary')}
        </button>
        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('addBook.heading')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.isbn')}</span>
            <div className="flex gap-2">
              <input
                {...register('isbn')}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={handleIsbnLookup}
                disabled={isLookingUp}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
              >
                {isLookingUp ? t('addBook.searching') : t('addBook.search')}
              </button>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                aria-label={t('addBook.scanBarcode')}
                className="rounded-md bg-gray-100 px-3 py-2 text-gray-800 hover:bg-gray-200"
              >
                📷
              </button>
            </div>
          </label>

          {showScanner && (
            <BarcodeScannerModal onScan={handleScanResult} onClose={() => setShowScanner(false)} />
          )}

          {lookupCoverUrl && (
            <img src={lookupCoverUrl} className="w-24 rounded-md" />
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.title')}</span>
            <input
              {...register('title', { required: t('addBook.titleRequired') })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.author')}</span>
            <input
              {...register('author')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.description')}</span>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.collection')}</span>
            <input
              {...register('collection')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.link')}</span>
            <input
              {...register('link')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.ageRecommendation')}</span>
            <input
              {...register('age')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.tags')}</span>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} suggestions={allTags} />
              )}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('addBook.cover')}</span>
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
            {addBook.isPending ? t('addBook.saving') : t('addBook.save')}
          </button>
        </form>
      </div>
    </div>
  )
}
