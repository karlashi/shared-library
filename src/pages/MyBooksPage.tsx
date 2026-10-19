import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../services/queries'
import { BookCard } from '../components/BookCard'
import { BookRow } from '../components/BookRow'
import { Header } from '../components/Header'

export function MyBooksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: books = [] } = useBooks()
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid')

  const myBooks = books.filter((b) => b.owner_id === user?.id && !b.archived)
  const myArchivedBooks = books.filter((b) => b.owner_id === user?.id && b.archived)

  const allMyIds = myBooks.map((b) => b.id)
  const allArchivedIds = myArchivedBooks.map((b) => b.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{t('myBooks.heading')}</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title={t('home.viewGrid')}
              aria-pressed={viewMode === 'grid'}
              className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'grid' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ⊞
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              title={t('home.viewCompact')}
              aria-pressed={viewMode === 'compact'}
              className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'compact' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ☰
            </button>
          </div>
        </div>

        {/* MY BOOKS */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.myBooks')}</h2>
        {myBooks.length === 0 ? (
          <p className="mb-8 text-gray-600">{t('profile.noBooksYet')}</p>
        ) : viewMode === 'grid' ? (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {myBooks.map((book) => (
              <BookCard key={book.id} book={book} navList={allMyIds} />
            ))}
          </div>
        ) : (
          <div className="mb-8 flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {myBooks.map((book) => (
              <BookRow key={book.id} book={book} navList={allMyIds} />
            ))}
          </div>
        )}

        {/* ARCHIVED BOOKS */}
        {myArchivedBooks.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.archived')}</h2>
            {viewMode === 'grid' ? (
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {myArchivedBooks.map((book) => (
                  <BookCard key={book.id} book={book} navList={allArchivedIds} />
                ))}
              </div>
            ) : (
              <div className="mb-8 flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {myArchivedBooks.map((book) => (
                  <BookRow key={book.id} book={book} navList={allArchivedIds} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
