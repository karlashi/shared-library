import { useTranslation } from 'react-i18next'
import { useBooks, useAllLoans, useProfiles } from '../services/queries'
import { Header } from '../components/Header'
import type { Book } from '../types/Books'
import type { Loan } from '../types/Loan'

const CATEGORY_ORDER = ['infantil', 'juvenil', 'adultos', 'comic', 'poesia', 'arte', 'idiomas'] as const

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-center">
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  )
}

function BreakdownBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{count}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = keyFn(item)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export function StatsPage() {
  const { t } = useTranslation()
  const { data: books = [] } = useBooks()
  const { data: loans = [] } = useAllLoans()
  const { data: profiles = [] } = useProfiles()

  const activeBooks = books.filter((b) => !b.archived)
  const archivedBooks = books.filter((b) => b.archived)
  const activeLoans = loans.filter((l) => !l.returned_at)
  const listedBooks = activeBooks.filter((b) => b.listing_type)

  // Category breakdown (covers things like "books for small kids" via the infantil category)
  const categoryCounts = countBy(activeBooks, (b: Book) => b.category ?? null)
  const uncategorizedCount = activeBooks.length - Array.from(categoryCounts.values()).reduce((a, b) => a + b, 0)
  const categoryRows = [
    ...CATEGORY_ORDER.map((cat) => ({ key: cat, label: t(`categories.${cat}`), count: categoryCounts.get(cat) ?? 0 })),
    ...(uncategorizedCount > 0 ? [{ key: 'uncategorized', label: t('stats.uncategorized'), count: uncategorizedCount }] : []),
  ].filter((row) => row.count > 0)
  const maxCategoryCount = Math.max(1, ...categoryRows.map((r) => r.count))

  // Top tags ("top topics")
  const tagCounts = new Map<string, number>()
  for (const book of activeBooks) {
    for (const tag of book.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Language breakdown
  const languageCounts = new Map<string, number>()
  for (const book of activeBooks) {
    for (const lang of book.languages ?? []) {
      languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1)
    }
  }
  const languageRows = Array.from(languageCounts.entries())
    .map(([code, count]) => ({ key: code, label: t(`languages.${code}`, code), count }))
    .sort((a, b) => b.count - a.count)
  const maxLanguageCount = Math.max(1, ...languageRows.map((r) => r.count))

  // Most-borrowed books
  const loanCountByBook = countBy(loans, (l: Loan) => l.book_id)
  const bookById = new Map(books.map((b) => [b.id, b]))
  const mostBorrowed = Array.from(loanCountByBook.entries())
    .map(([bookId, count]) => ({ book: bookById.get(bookId), count }))
    .filter((row): row is { book: Book; count: number } => !!row.book)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('stats.heading')}</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label={t('stats.activeBooks')} value={activeBooks.length} />
          <StatCard label={t('stats.archivedBooks')} value={archivedBooks.length} />
          <StatCard label={t('stats.members')} value={profiles.length} />
          <StatCard label={t('stats.totalLoans')} value={loans.length} />
          <StatCard label={t('stats.activeLoans')} value={activeLoans.length} />
          <StatCard label={t('stats.listedBooks')} value={listedBooks.length} />
        </div>

        {categoryRows.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('stats.byCategory')}</h2>
            <div className="space-y-3">
              {categoryRows.map((row) => (
                <BreakdownBar key={row.key} label={row.label} count={row.count} max={maxCategoryCount} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('stats.topTags')}</h2>
          {topTags.length === 0 ? (
            <p className="text-sm text-gray-600">{t('stats.noTags')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-800"
                >
                  {tag}
                  <span className="font-semibold text-gray-500">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {languageRows.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('stats.byLanguage')}</h2>
            <div className="space-y-3">
              {languageRows.map((row) => (
                <BreakdownBar key={row.key} label={row.label} count={row.count} max={maxLanguageCount} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('stats.mostBorrowed')}</h2>
          {mostBorrowed.length === 0 ? (
            <p className="text-sm text-gray-600">{t('stats.noLoans')}</p>
          ) : (
            <ol className="space-y-2">
              {mostBorrowed.map((row, i) => (
                <li key={row.book.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <span className="mr-2 text-gray-400">{i + 1}.</span>
                    {row.book.title}
                  </span>
                  <span className="font-semibold text-gray-900">{row.count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
