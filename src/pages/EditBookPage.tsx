import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useBook, useDeleteBook, useSetArchived } from '../services/queries'
import { validateImageFile, uploadCoverImage, deleteCoverImage } from '../services/storage'
import { LanguageCheckboxes } from '../components/LanguageCheckboxes'

type FormValues = {
  title: string
  author: string
  description: string
  isbn: string
  collection: string
  age_recommendation: string
  link: string
  listing_type: '' | 'gift' | 'sale'
  listing_comment: string
  category: string
  languages: string[]
}

export function EditBookPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()
  const isAdmin = !!profile?.is_admin

  const { data: book, isLoading } = useBook(id)
  const deleteBook = useDeleteBook()
  const setArchived = useSetArchived()

  const [cover_url, setCoverUrl] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '', author: '', description: '', isbn: '',
      collection: '', age_recommendation: '', link: '',
      listing_type: '', listing_comment: '', category: '', languages: [],
    },
  })

  const listingType = watch('listing_type')

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
      listing_type: book.listing_type || '',
      listing_comment: book.listing_comment || '',
      category: book.category || '',
      languages: book.languages ?? [],
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
          listing_type: values.listing_type || null,
          listing_comment: values.listing_type ? values.listing_comment : null,
          category: values.category || null,
          languages: values.languages,
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      navigate(`/book/${id}`)
    },
    onError: () => alert(t('editBook.updateError')),
  })

  const onSubmit = (values: FormValues) => {
    updateBook.mutate(values)
  }

  const handleDelete = () => {
    if (!id) return
    if (!window.confirm(t('editBook.deleteConfirm'))) {
      return
    }

    deleteBook.mutate(
      { bookId: id, coverUrl: cover_url },
      {
        onSuccess: () => {
          alert(t('editBook.deletedSuccess'))
          navigate('/')
        },
        onError: (error) => {
          console.error(error)
          alert(error instanceof Error ? error.message : t('editBook.deleteError'))
        },
      }
    )
  }

  const handleToggleArchived = () => {
    if (!id) return

    setArchived.mutate(
      { bookId: id, archived: !book?.archived },
      {
        onError: (error) => {
          console.error(error)
          alert(t('editBook.archiveError'))
        },
      }
    )
  }

  if (isLoading || !book) return <p>{t('common.loading')}</p>
  if (book.owner_id !== user?.id && !isAdmin) return <Navigate to={`/book/${id}`} replace />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('editBook.heading')}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.title')}</span>
            <input
              {...register('title', { required: t('editBook.titleRequired') })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.author')}</span>
            <input
              {...register('author')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.description')}</span>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.isbn')}</span>
            <input
              {...register('isbn')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <p className="text-sm text-gray-500">
            {t('editBook.tagsHint')}
          </p>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.cover')}</span>

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
                  alert(t('editBook.uploadImageError'))
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
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.collection')}</span>
            <input
              {...register('collection')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.ageRecommendation')}</span>
            <input
              {...register('age_recommendation')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.link')}</span>
            <input
              {...register('link')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.category')}</span>
            <select
              {...register('category')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">{t('editBook.categoryNone')}</option>
              <option value="infantil">{t('categories.infantil')}</option>
              <option value="juvenil">{t('categories.juvenil')}</option>
              <option value="adultos">{t('categories.adultos')}</option>
              <option value="comic">{t('categories.comic')}</option>
              <option value="poesia">{t('categories.poesia')}</option>
              <option value="arte">{t('categories.arte')}</option>
              <option value="idiomas">{t('categories.idiomas')}</option>
            </select>
          </label>

          <div className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.languages')}</span>
            <Controller
              name="languages"
              control={control}
              render={({ field }) => (
                <LanguageCheckboxes value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.listingType')}</span>
            <select
              {...register('listing_type')}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">{t('editBook.listingTypeNone')}</option>
              <option value="gift">{t('editBook.listingTypeGift')}</option>
              <option value="sale">{t('editBook.listingTypeSale')}</option>
            </select>
          </label>

          {listingType && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">{t('editBook.comment')}</span>
              <textarea
                {...register('listing_comment')}
                rows={2}
                placeholder={listingType === 'gift' ? t('editBook.commentPlaceholderGift') : t('editBook.commentPlaceholderSale')}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={updateBook.isPending}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {updateBook.isPending ? t('editBook.saving') : t('editBook.saveChanges')}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
          >
            {t('common.cancel')}
          </button>

          <button
            type="button"
            onClick={handleToggleArchived}
            disabled={setArchived.isPending}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
          >
            {setArchived.isPending
              ? t('editBook.saving')
              : book.archived
                ? t('editBook.restoreBook')
                : t('editBook.archiveBook')}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteBook.isPending}
            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteBook.isPending ? t('editBook.deleting') : t('editBook.deleteBook')}
          </button>
        </form>
      </div>
    </div>
  )
}
