import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useBooks, useAllTags } from '../services/queries'
import { supabase } from '../services/supabaseClient'
import { lookupBookInfo, lookupBookInfoByTitleAuthor } from '../services/bookLookup'
import { validateImageFile, uploadCoverImage } from '../services/storage'
import { isBookIncomplete } from '../utils/bookCompleteness'
import { TagInput } from '../components/TagInput'
import { LanguageCheckboxes } from '../components/LanguageCheckboxes'
import { Header } from '../components/Header'
import type { Book } from '../types/Books'

type RowState = {
  description: string
  age: string
  tags: string[]
  cover_url: string
  category: string
  languages: string[]
}

function defaultRowState(book: Book): RowState {
  return {
    description: book.description ?? '',
    age: book.age_recommendation ?? '',
    tags: book.tags ?? [],
    cover_url: book.cover_url ?? '',
    category: book.category ?? '',
    languages: book.languages ?? [],
  }
}

export function BulkEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: books = [] } = useBooks()
  const { data: allTags = [] } = useAllTags()

  const [edits, setEdits] = useState<Record<string, RowState>>({})
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const incompleteBooks = books.filter((b) => !b.archived && isBookIncomplete(b))

  const getRowState = (book: Book): RowState => edits[book.id] ?? defaultRowState(book)

  const updateRow = (book: Book, patch: Partial<RowState>) => {
    setEdits((prev) => ({ ...prev, [book.id]: { ...getRowState(book), ...patch } }))
  }

  const handleFetchData = async (book: Book) => {
    if (!book.isbn && !(book.title && book.author)) return
    setFetchingId(book.id)
    try {
      const result = book.isbn
        ? await lookupBookInfo(book.isbn)
        : await lookupBookInfoByTitleAuthor(book.title, book.author)

      if (!result) {
        alert(t('bulkEdit.fetchNoResult'))
        return
      }

      const current = getRowState(book)
      const description = current.description || result.description
      const cover_url = current.cover_url || result.coverUrl
      const foundSomethingNew = description !== current.description || cover_url !== current.cover_url

      if (!foundSomethingNew) {
        alert(t('bulkEdit.fetchNoNewData'))
        return
      }

      updateRow(book, { description, cover_url })
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : t('bulkEdit.fetchDataError'))
    } finally {
      setFetchingId(null)
    }
  }

  const handleCoverUpload = async (book: Book, file: File | undefined) => {
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      alert(validationError)
      return
    }

    setUploadingId(book.id)
    try {
      const coverUrl = await uploadCoverImage(file)
      updateRow(book, { cover_url: coverUrl })
    } catch (err) {
      console.error(err)
      alert(t('bulkEdit.uploadCoverError'))
    } finally {
      setUploadingId(null)
    }
  }

  const saveAll = useMutation({
    mutationFn: async () => {
      const dirtyBooks = Object.keys(edits)
        .map((id) => incompleteBooks.find((b) => b.id === id))
        .filter((b): b is Book => !!b)

      const results = await Promise.allSettled(
        dirtyBooks.map(async (book) => {
          const state = getRowState(book)

          const { error } = await supabase
            .from('books')
            .update({
              description: state.description,
              age_recommendation: state.age,
              cover_url: state.cover_url,
              category: state.category || null,
              languages: state.languages,
            })
            .eq('id', book.id)
          if (error) throw error

          const existingTags = book.tags ?? []
          const newTags = state.tags.filter((tag) => !existingTags.includes(tag))
          if (newTags.length > 0 && user) {
            const { error: tagsError } = await supabase
              .from('book_tags')
              .insert(newTags.map((tag) => ({ book_id: book.id, tag, added_by: user.id })))
            if (tagsError) throw tagsError
          }
        })
      )

      const failed = results.filter((r) => r.status === 'rejected').length
      return { total: dirtyBooks.length, failed }
    },
    onSuccess: ({ total, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      setEdits({})
      if (failed > 0) {
        alert(t('bulkEdit.saveAllError'))
      } else {
        alert(t('bulkEdit.saveSummary', { saved: total - failed, total }))
      }
    },
    onError: (err) => {
      console.error(err)
      alert(t('bulkEdit.saveAllError'))
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          {t('bulkEdit.backToLibrary')}
        </button>

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('bulkEdit.heading')}</h1>

        {incompleteBooks.length === 0 ? (
          <p className="text-gray-600">{t('bulkEdit.noIncompleteBooks')}</p>
        ) : (
          <>
            <div className="space-y-4">
              {incompleteBooks.map((book) => {
                const state = getRowState(book)

                return (
                  <div key={book.id} className="flex gap-4 rounded-lg border border-gray-200 p-3">
                    {state.cover_url ? (
                      <img
                        src={state.cover_url}
                        className="h-24 w-16 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <label className="flex h-24 w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-gray-300 p-1 text-center text-[10px] text-gray-500 hover:bg-gray-50">
                        {uploadingId === book.id ? t('common.loading') : t('bulkEdit.missingCover')}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingId === book.id}
                          onChange={(e) => {
                            handleCoverUpload(book, e.target.files?.[0])
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link to={`/book/${book.id}`} className="font-semibold text-gray-900 hover:underline">
                          {book.title}
                          <span className="font-normal text-gray-600"> — {book.author}</span>
                        </Link>

                        {(book.isbn || (book.title && book.author)) && (
                          <button
                            type="button"
                            onClick={() => handleFetchData(book)}
                            disabled={fetchingId === book.id}
                            className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                          >
                            {fetchingId === book.id ? t('bulkEdit.fetchingData') : t('bulkEdit.fetchData')}
                          </button>
                        )}
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-700">{t('bulkEdit.description')}</span>
                        <textarea
                          value={state.description}
                          onChange={(e) => updateRow(book, { description: e.target.value })}
                          rows={2}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-700">{t('bulkEdit.ageRecommendation')}</span>
                        <input
                          value={state.age}
                          onChange={(e) => updateRow(book, { age: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-700">{t('bulkEdit.tags')}</span>
                        <TagInput
                          value={state.tags}
                          onChange={(tags) => updateRow(book, { tags })}
                          suggestions={allTags}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-700">{t('addBook.category')}</span>
                        <select
                          value={state.category}
                          onChange={(e) => updateRow(book, { category: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="">{t('addBook.categoryNone')}</option>
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
                        <span className="mb-1 block text-xs font-medium text-gray-700">{t('bulkEdit.languages')}</span>
                        <LanguageCheckboxes
                          value={state.languages}
                          onChange={(languages) => updateRow(book, { languages })}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => saveAll.mutate()}
              disabled={saveAll.isPending || Object.keys(edits).length === 0}
              className="mt-6 rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saveAll.isPending ? t('bulkEdit.savingAll') : t('bulkEdit.saveAll')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
