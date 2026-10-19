import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Fuse from 'fuse.js'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useBooks, useProfiles } from './services/queries'
import { BookCard } from './components/BookCard'
import { BookRow } from './components/BookRow'
import { RequireAuth } from './components/RequireAuth'
import { Header } from './components/Header'
import { BackToTop } from './components/BackToTop'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AboutPage } from './pages/AboutPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'
import { AddBookPage } from './pages/AddBookPage'
import { BookDetailsPage } from './pages/BookDetailsPage'
import { EditBookPage } from './pages/EditBookPage'
import { BulkEditPage } from './pages/BulkEditPage'
import { DatabasePage } from './pages/DatabasePage'
import { ActivityPage } from './pages/ActivityPage'
import { MyBooksPage } from './pages/MyBooksPage'
import { LanguageCheckboxes } from './components/LanguageCheckboxes'
import { LANGUAGE_CODES, OTHER_LANGUAGES_VALUE } from './constants/languages'

const SESSION_KEY = 'home_filters'

type FilterState = {
  search: string
  filterValue: string
  categoryFilter: string
  languageFilter: string[]
  ownerFilter: string
  sortBy: 'recent' | 'title' | 'author' | 'owner'
  viewMode: 'grid' | 'compact'
  hideMyBooks: boolean
}

function loadFilters(): Partial<FilterState> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveFilters(state: FilterState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function Home() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { data: books = [] } = useBooks()
  const { data: profiles = [] } = useProfiles()
  const isApproved = !!profile?.approved

  const saved = loadFilters()

  const [search, setSearch] = useState(saved.search ?? '')
  const [filterValue, setFilterValue] = useState(saved.filterValue ?? 'all')
  const [categoryFilter, setCategoryFilter] = useState(saved.categoryFilter ?? 'all')
  const [languageFilter, setLanguageFilter] = useState<string[]>(saved.languageFilter ?? [])
  const [ownerFilter, setOwnerFilter] = useState(saved.ownerFilter ?? 'all')
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author' | 'owner'>(saved.sortBy ?? 'recent')
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(saved.viewMode ?? 'grid')
  const [hideMyBooks, setHideMyBooks] = useState(saved.hideMyBooks ?? true)

  // Persist filters to sessionStorage on every change
  useEffect(() => {
    saveFilters({ search, filterValue, categoryFilter, languageFilter, ownerFilter, sortBy, viewMode, hideMyBooks })
  }, [search, filterValue, categoryFilter, languageFilter, ownerFilter, sortBy, viewMode, hideMyBooks])

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
      const matchesLanguage =
        languageFilter.length === 0 ||
        (book.languages ?? []).some(
          (l) =>
            languageFilter.includes(l) ||
            (languageFilter.includes(OTHER_LANGUAGES_VALUE) && !(LANGUAGE_CODES as readonly string[]).includes(l))
        )
      const matchesOwnBooks = !hideMyBooks || book.owner_id !== user?.id
      const matchesOwner = ownerFilter === 'all' || book.owner_id === ownerFilter

      return matchesSearch && matchesFilter && matchesCategory && matchesLanguage && matchesOwnBooks && matchesOwner
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'es')
      if (sortBy === 'author') return (a.author ?? '').localeCompare(b.author ?? '', 'es')
      if (sortBy === 'owner') {
        const nameA = profiles.find((p) => p.id === a.owner_id)?.name ?? ''
        const nameB = profiles.find((p) => p.id === b.owner_id)?.name ?? ''
        return nameA.localeCompare(nameB, 'es')
      }
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
            <Link to="/database">
              <button className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200">
                {t('home.databaseView')}
              </button>
            </Link>
          </div>
        )}

        {/* SEARCH + FILTERS — two-line desktop layout */}
        <div className="mb-6 flex flex-col gap-3">
          {/* Line 1: search full-width */}
          <input
            placeholder={t('home.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />

          {/* Line 2: all filters in a row */}
          <div className="flex flex-wrap items-end gap-3">
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

            <div className="flex flex-col gap-1 text-xs text-gray-500">
              {t('home.languageFilterLabel')}
              <div className="flex gap-2 rounded-md border border-gray-300 px-2 py-1.5">
                <LanguageCheckboxes value={languageFilter} onChange={setLanguageFilter} includeOthers />
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs text-gray-500">
              {t('home.ownerFilterLabel')}
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                aria-label={t('home.ownerFilterLabel')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="all">{t('home.allOwners')}</option>
                {profiles.filter((p) => !p.deleted).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-gray-500">
              {t('home.sortLabel')}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'title' | 'author' | 'owner')}
                aria-label={t('home.sortLabel')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="recent">{t('home.sortRecent')}</option>
                <option value="title">{t('home.sortTitle')}</option>
                <option value="author">{t('home.sortAuthor')}</option>
                <option value="owner">{t('home.sortOwner')}</option>
              </select>
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
        </div>

        {/* VIEW TOGGLE + BOOK LIST */}
        <div className="mb-3 flex justify-end gap-2">
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

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                navList={filteredBookIds}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {filteredBooks.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                navList={filteredBookIds}
              />
            ))}
          </div>
        )}
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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/my-books" element={<RequireAuth><MyBooksPage /></RequireAuth>} />
          <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
          <Route path="/activity" element={<RequireAuth><ActivityPage /></RequireAuth>} />
          <Route path="/add" element={<RequireAuth><AddBookPage /></RequireAuth>} />
          <Route path="/bulk-edit" element={<RequireAuth><BulkEditPage /></RequireAuth>} />
          <Route path="/database" element={<RequireAuth><DatabasePage /></RequireAuth>} />
          <Route path="/book/:id" element={<RequireAuth><BookDetailsPage /></RequireAuth>} />
          <Route path="/book/:id/edit" element={<RequireAuth><EditBookPage /></RequireAuth>} />
        </Routes>
        <BackToTop />
      </BrowserRouter>
    </AuthProvider>
  )
}
