import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useBooks, useAllLoans, useProfiles } from '../services/queries'
import { Header } from '../components/Header'

export function ActivityPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { data: books = [] } = useBooks()
  const { data: loans = [] } = useAllLoans()
  const { data: profiles = [] } = useProfiles()

  if (!profile?.is_admin) return <Navigate to="/" replace />

  const getBookById = (id: string) => books.find((b) => b.id === id)
  const getProfileName = (id: string) =>
    profiles.find((p) => p.id === id)?.name ?? t('common.unknown')
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const sortedLoans = [...loans].sort((a, b) => b.borrowed_at.localeCompare(a.borrowed_at))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('activity.heading')}</h1>

        {sortedLoans.length === 0 ? (
          <p className="text-gray-600">{t('activity.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {sortedLoans.map((loan) => {
              const book = getBookById(loan.book_id)
              return (
                <li key={loan.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {book?.title ?? t('profile.unknownBook')}
                      {book && <span className="font-normal text-gray-600"> — {book.author}</span>}
                    </p>
                    {loan.returned_at ? (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-sm text-green-800">{t('profile.returned')}</span>
                    ) : (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-sm text-red-800">{t('profile.active')}</span>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-4">
                    <div>
                      <dt className="text-gray-500">{t('profile.owner')}</dt>
                      <dd>{getProfileName(book?.owner_id ?? '')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t('activity.borrower')}</dt>
                      <dd>{getProfileName(loan.borrower_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">{t('profile.borrowedDate')}</dt>
                      <dd>{formatDate(loan.borrowed_at)}</dd>
                    </div>
                    {loan.returned_at && (
                      <div>
                        <dt className="text-gray-500">{t('profile.returned')}</dt>
                        <dd>{formatDate(loan.returned_at)}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
