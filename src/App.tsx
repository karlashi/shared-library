import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useBooks } from './services/queries'
import { BookCard } from './components/BookCard'
import { RequireAuth } from './components/RequireAuth'
import { Header } from './components/Header'
import { BackToTop } from './components/BackToTop'
import { isBookIncomplete } from './utils/bookCompleteness'
import { LoginPage } from './pages/LoginPage'
import { AboutPage } from './pages/AboutPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'
import { AddBookPage } from './pages/AddBookPage'
import { BookDetailsPage } from './pages/BookDetailsPage'
import { EditBookPage } from './pages/EditBookPage'
import { BulkEditPage } from './pages/BulkEditPage'
import { ActivityPage } from './pages/ActivityPage'

function Home() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { data: books = [] } = useBooks()
  const isApproved = !!profile?.approved

  const [search, setSearch] = useState('')
  const [filterValue, setFilterValue] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [hideMyBooks, setHideMyBooks] = useState(true)

  const activeBooks = books.filter((book) => !book.archived)

  const fuse = useMemo(
    () =>
      new Fuse(activeBooks, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'author', weight: 0.3 },
          { name: 'tags', weight: 0.2 },
          { name: 'description', weight: 0.1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [activeBooks]
  )

  const matchedIds = useMemo(() => {
    const term = search.trim()
    if (!term) return null
    return new Set(fuse.search(term).map((result) => result.item.id))
  }, [fuse, search])

  const filteredBooks = activeBooks
    .filter((book) => {
      const matchesSearch = !matchedIds || matchedIds.has(book.id)

      const matchesFilter =
        filterValue === 'all' ||
        (filterValue === 'available' &&
          !book.isBorrowed &&
          book.status !== 'Fuera de circulación') ||
        (filterValue === 'borrowed' && book.isBorrowed) ||
        (filterValue === 'blocked' &&
          book.status === 'Fuera de circulación') ||
        (filterValue === 'gift' && book.listing_type === 'gift') ||
        (filterValue === 'sale' && book.listing_type === 'sale')

      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter
      const matchesIncomplete = !incompleteOnly || isBookIncomplete(book)
      const matchesOwnBooks = !hideMyBooks || book.owner_id !== user?.id

      return matchesSearch && matchesFilter && matchesCategory && matchesIncomplete && matchesOwnBooks
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'es')
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })

  const filteredBookIds = filteredBooks.map((b) => b.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <Header />

        {profile && !isApproved && (
          <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('home.pendingApproval')}
          </div>
        )}

        {isApproved && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link to="/add">
              <button className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90">
                {t('home.addBook')}
              </button>
            </Link>
            <Link to="/bulk-edit">
              <button className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200">
                {t('home.bulkEdit')}
              </button>
            </Link>
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 sm:w-64"
          />

          <label className="flex flex-col gap-1 text-xs text-gray-500">
            {t('home.statusFilterLabel')}
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              aria-label={t('home.statusFilterLabel')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('home.allStatus')}</option>
              <option value="available">{t('home.available')}</option>
              <option value="borrowed">{t('home.borrowed')}</option>
              <option value="blocked">{t('home.blocked')}</option>
              <option value="gift">{t('bookCard.gift')}</option>
              <option value="sale">{t('bookCard.sale')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-gray-500">
            {t('home.categoryFilterLabel')}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label={t('home.categoryFilterLabel')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('home.allCategories')}</option>
              <option value="infantil">{t('categories.infantil')}</option>
              <option value="juvenil">{t('categories.juvenil')}</option>
              <option value="adultos">{t('categories.adultos')}</option>
              <option value="comic">{t('categories.comic')}</option>
              <option value="poesia">{t('categories.poesia')}</option>
              <option value="arte">{t('categories.arte')}</option>
              <option value="idiomas">{t('categories.idiomas')}</option>
            </select>
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="recent">{t('home.sortRecent')}</option>
            <option value="title">{t('home.sortTitle')}</option>
          </select>

          <label className="flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={incompleteOnly}
              onChange={(e) => setIncompleteOnly(e.target.checked)}
            />
            {t('home.incompleteOnly')}
          </label>

          <label className="flex items-center gap-1.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={hideMyBooks}
              onChange={(e) => setHideMyBooks(e.target.checked)}
            />
            {t('home.hideMyBooks')}
          </label>
        </div>

        {/* BOOK GRID */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              navList={filteredBookIds}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
          <Route path="/activity" element={<RequireAuth><ActivityPage /></RequireAuth>} />
          <Route path="/add" element={<RequireAuth><AddBookPage /></RequireAuth>} />
          <Route path="/bulk-edit" element={<RequireAuth><BulkEditPage /></RequireAuth>} />
          <Route path="/book/:id" element={<RequireAuth><BookDetailsPage /></RequireAuth>} />
          <Route path="/book/:id/edit" element={<RequireAuth><EditBookPage /></RequireAuth>} />
        </Routes>
        <BackToTop />
      </BrowserRouter>
    </AuthProvider>
  )
}