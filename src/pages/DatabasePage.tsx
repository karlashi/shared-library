import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBooks } from '../services/queries'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabaseClient'
import { Header } from '../components/Header'
import type { Book } from '../types/Books'

type SortCol = 'title' | 'author' | 'collection' | 'language' | 'status'

type InlineEdit = {
  title: string
  author: string
  collection: string
}

function defaultEdit(book: Book): InlineEdit {
  return {
    title: book.title,
    author: book.author,
    collection: book.collection ?? '',
  }
}

function bookStatus(book: Book): string {
  if (book.archived) return 'archived'
  if (book.status === 'Fuera de circulación') return 'blocked'
  if (book.isBorrowed) return 'borrowed'
  if (book.listing_type === 'gift') return 'gift'
  if (book.listing_type === 'sale') return 'sale'
  return 'available'
}

export function DatabasePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: books = [] } = useBooks()

  // Only show current user's books (active + archived)
  const myBooks = books.filter((b) => b.owner_id === user?.id)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [edits, setEdits] = useState<Record<string, InlineEdit>>({})
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('title')
  const [sortAsc, setSortAsc] = useState(true)

  const visibleBooks = (
    search
      ? myBooks.filter(
          (b) =>
            b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.author.toLowerCase().includes(search.toLowerCase())
        )
      : myBooks
  ).slice().sort((a, b) => {
    let va = ''
    let vb = ''
    if (sortCol === 'title') { va = a.title; vb = b.title }
    else if (sortCol === 'author') { va = a.author; vb = b.author }
    else if (sortCol === 'collection') { va = a.collection ?? ''; vb = b.collection ?? '' }
    else if (sortCol === 'language') { va = (a.languages ?? []).join(','); vb = (b.languages ?? []).join(',') }
    else if (sortCol === 'status') { va = bookStatus(a); vb = bookStatus(b) }
    const cmp = va.localeCompare(vb, 'es')
    return sortAsc ? cmp : -cmp
  })

  const allSelected = visibleBooks.length > 0 && visibleBooks.every((b) => selected.has(b.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleBooks.forEach((b) => next.delete(b.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        visibleBooks.forEach((b) => next.add(b.id))
        return next
      })
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSortCol = (col: SortCol) => {
    if (sortCol === col) setSortAsc((v) => !v)
    else { setSortCol(col); setSortAsc(true) }
  }

  const sortIndicator = (col: SortCol) => {
    if (sortCol !== col) return <span className="ml-1 opacity-30">↕</span>
    return <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  const getEdit = (book: Book): InlineEdit => edits[book.id] ?? defaultEdit(book)

  const updateEdit = (book: Book, patch: Partial<InlineEdit>) => {
    setEdits((prev) => ({ ...prev, [book.id]: { ...getEdit(book), ...patch } }))
  }

  // Inline status update (saves immediately)
  const updateStatus = useMutation({
    mutationFn: async (vars: { bookId: string; value: string }) => {
      const updates: Record<string, unknown> = {}
      if (vars.value === 'archived') {
        updates.archived = true
      } else if (vars.value === 'available') {
        updates.status = 'Disponible'
        updates.listing_type = null
        updates.archived = false
      } else if (vars.value === 'blocked') {
        updates.status = 'Fuera de circulación'
        updates.archived = false
      } else if (vars.value === 'gift') {
        updates.listing_type = 'gift'
        updates.status = 'Disponible'
        updates.archived = false
      } else if (vars.value === 'sale') {
        updates.listing_type = 'sale'
        updates.status = 'Disponible'
        updates.archived = false
      }
      const { error } = await supabase.from('books').update(updates).eq('id', vars.bookId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
    onError: (err) => {
      console.error(err)
      alert(t('database.statusUpdateError'))
    },
  })

  // Bulk status action
  const bulkAction = useMutation({
    mutationFn: async (action: 'gift' | 'sale' | 'blocked' | 'available') => {
      const ids = Array.from(selected)
      if (action === 'gift' || action === 'sale') {
        const { error } = await supabase
          .from('books')
          .update({ listing_type: action })
          .in('id', ids)
        if (error) throw error
      } else if (action === 'blocked') {
        const { error } = await supabase
          .from('books')
          .update({ status: 'Fuera de circulación' })
          .in('id', ids)
        if (error) throw error
      } else if (action === 'available') {
        const { error } = await supabase
          .from('books')
          .update({ status: 'Disponible', listing_type: null })
          .in('id', ids)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      setSelected(new Set())
    },
    onError: (err) => {
      console.error(err)
      alert(t('database.bulkActionError'))
    },
  })

  // Save inline edits for all dirty rows
  const saveEdits = useMutation({
    mutationFn: async () => {
      const dirtyIds = Object.keys(edits)
      const results = await Promise.allSettled(
        dirtyIds.map(async (id) => {
          const edit = edits[id]
          const { error } = await supabase
            .from('books')
            .update({
              title: edit.title,
              author: edit.author,
              collection: edit.collection || null,
            })
            .eq('id', id)
          if (error) throw error
        })
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      return { total: dirtyIds.length, failed }
    },
    onSuccess: ({ total, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      setEdits({})
      if (failed > 0) {
        alert(t('database.saveError'))
      } else {
        alert(t('database.saveSummary', { saved: total - failed, total }))
      }
    },
    onError: (err) => {
      console.error(err)
      alert(t('database.saveError'))
    },
  })

  const hasEdits = Object.keys(edits).length > 0
  const hasSelection = selected.size > 0

  const thClass = 'px-3 py-3 text-left cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 transition-colors'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Header />

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          {t('database.backToLibrary')}
        </button>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{t('database.heading')}</h1>
          <input
            placeholder={t('database.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-64"
          />
        </div>

        {/* BULK ACTION BAR */}
        {hasSelection && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <span className="text-sm font-medium text-blue-900">
              {t('database.selectedCount', { count: selected.size })}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => bulkAction.mutate('gift')}
                disabled={bulkAction.isPending}
                className="rounded-md bg-purple-100 px-3 py-1.5 text-sm text-purple-800 hover:bg-purple-200 disabled:opacity-50"
              >
                🎁 {t('database.markGift')}
              </button>
              <button
                type="button"
                onClick={() => bulkAction.mutate('sale')}
                disabled={bulkAction.isPending}
                className="rounded-md bg-amber-100 px-3 py-1.5 text-sm text-amber-800 hover:bg-amber-200 disabled:opacity-50"
              >
                💰 {t('database.markSale')}
              </button>
              <button
                type="button"
                onClick={() => bulkAction.mutate('blocked')}
                disabled={bulkAction.isPending}
                className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                🚫 {t('database.markBlocked')}
              </button>
              <button
                type="button"
                onClick={() => bulkAction.mutate('available')}
                disabled={bulkAction.isPending}
                className="rounded-md bg-green-100 px-3 py-1.5 text-sm text-green-800 hover:bg-green-200 disabled:opacity-50"
              >
                ✅ {t('database.markAvailable')}
              </button>
            </div>
          </div>
        )}

        {/* SAVE EDITS BAR */}
        {hasEdits && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-sm text-amber-900">
              {t('database.unsavedEdits', { count: Object.keys(edits).length })}
            </span>
            <button
              type="button"
              onClick={() => saveEdits.mutate()}
              disabled={saveEdits.isPending}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saveEdits.isPending ? t('database.saving') : t('database.saveEdits')}
            </button>
            <button
              type="button"
              onClick={() => setEdits({})}
              className="text-sm text-amber-700 hover:underline"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={t('database.selectAll')}
                  />
                </th>
                <th className={thClass} onClick={() => handleSortCol('title')}>
                  {t('database.colTitle')}{sortIndicator('title')}
                </th>
                <th className={thClass} onClick={() => handleSortCol('author')}>
                  {t('database.colAuthor')}{sortIndicator('author')}
                </th>
                <th className={`hidden sm:table-cell ${thClass}`} onClick={() => handleSortCol('collection')}>
                  {t('database.colCollection')}{sortIndicator('collection')}
                </th>
                <th className={`hidden md:table-cell ${thClass}`} onClick={() => handleSortCol('language')}>
                  {t('database.colLanguage')}{sortIndicator('language')}
                </th>
                <th className={thClass} onClick={() => handleSortCol('status')}>
                  {t('database.colStatus')}{sortIndicator('status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleBooks.map((book) => {
                const edit = getEdit(book)
                const isDirty = !!edits[book.id]
                const currentStatus = bookStatus(book)

                return (
                  <tr
                    key={book.id}
                    className={`${selected.has(book.id) ? 'bg-blue-50' : 'hover:bg-gray-50'} ${isDirty ? 'bg-amber-50' : ''} ${book.archived ? 'opacity-60' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(book.id)}
                        onChange={() => toggleOne(book.id)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={edit.title}
                        onChange={(e) => updateEdit(book, { title: e.target.value })}
                        className="w-full rounded border border-transparent px-1 py-0.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={edit.author}
                        onChange={(e) => updateEdit(book, { author: e.target.value })}
                        className="w-full rounded border border-transparent px-1 py-0.5 text-sm focus:border-gray-300 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <input
                        value={edit.collection}
                        onChange={(e) => updateEdit(book, { collection: e.target.value })}
                        placeholder="—"
                        className="w-full rounded border border-transparent px-1 py-0.5 text-sm text-gray-500 placeholder-gray-300 focus:border-gray-300 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="hidden px-3 py-2 text-xs text-gray-500 md:table-cell">
                      {(book.languages ?? []).map((l) => l.toUpperCase()).join(', ') || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={currentStatus === 'borrowed' ? 'borrowed' : currentStatus}
                        disabled={currentStatus === 'borrowed' || updateStatus.isPending}
                        onChange={(e) => updateStatus.mutate({ bookId: book.id, value: e.target.value })}
                        className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 disabled:opacity-60"
                      >
                        <option value="available">{t('bookStatus.available')}</option>
                        <option value="gift">{t('bookCard.gift')}</option>
                        <option value="sale">{t('bookCard.sale')}</option>
                        <option value="blocked">{t('bookStatus.blocked')}</option>
                        <option value="archived">{t('database.statusArchived')}</option>
                        {currentStatus === 'borrowed' && (
                          <option value="borrowed">{t('bookStatus.borrowed')}</option>
                        )}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {visibleBooks.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">{t('database.noResults')}</p>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-400">
          {t('database.totalBooks', { count: visibleBooks.length })}
        </p>
      </div>
    </div>
  )
}

