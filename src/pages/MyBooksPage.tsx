import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../services/queries'
import { BookCard } from '../components/BookCard'
import { Header } from '../components/Header'

export function MyBooksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: books = [] } = useBooks()

  const myBooks = books.filter((b) => b.owner_id === user?.id && !b.archived)
  const myArchivedBooks = books.filter((b) => b.owner_id === user?.id && b.archived)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('myBooks.heading')}</h1>

        {/* MY BOOKS */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.myBooks')}</h2>
        {myBooks.length === 0 ? (
          <p className="mb-8 text-gray-600">{t('profile.noBooksYet')}</p>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {myBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* ARCHIVED BOOKS */}
        {myArchivedBooks.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.archived')}</h2>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {myArchivedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
