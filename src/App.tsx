import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: books = [] } = useBooks()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [hideMyBooks, setHideMyBooks] = useState(true)
  const [listingFilter, setListingFilter] = useState<'all' | 'gift' | 'sale'>('all')

  const filteredBooks = books
    .filter((book) => !book.archived)
    .filter((book) => {
      const searchTerm = search.toLowerCase()
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        (book.tags ?? []).some((tag) => tag.includes(searchTerm))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' &&
          !book.isBorrowed &&
          book.status !== 'Fuera de circulación') ||
        (statusFilter === 'borrowed' && book.isBorrowed) ||
        (statusFilter === 'blocked' &&
          book.status === 'Fuera de circulación')

      const matchesIncomplete = !incompleteOnly || isBookIncomplete(book)
      const matchesOwnBooks = !hideMyBooks || book.owner_id !== user?.id
      const matchesListing = listingFilter === 'all' || book.listing_type === listingFilter

      return matchesSearch && matchesStatus && matchesIncomplete && matchesOwnBooks && matchesListing
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'es')
      return (b.created_at ?? '').localeCompare(a.created_at ?? '')
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <Header />

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

        {/* SEARCH + FILTER */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">{t('home.all')}</option>
            <option value="available">{t('home.available')}</option>
            <option value="borrowed">{t('home.borrowed')}</option>
            <option value="blocked">{t('home.blocked')}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="recent">{t('home.sortRecent')}</option>
            <option value="title">{t('home.sortTitle')}</option>
          </select>

          <select
            value={listingFilter}
            onChange={(e) => setListingFilter(e.target.value as 'all' | 'gift' | 'sale')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">{t('home.all')}</option>
            <option value="gift">{t('bookCard.gift')}</option>
            <option value="sale">{t('bookCard.sale')}</option>
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