import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useProfiles } from '../services/queries'
import type { Book } from '../types/Books'

export function BookRow({ book, navList }: { book: Book; navList?: string[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profiles = [] } = useProfiles()

  const ownerName = profiles.find((p) => p.id === book.owner_id)?.name ?? t('common.unknown')

  const statusBadge = () => {
    if (book.status === 'Fuera de circulación') {
      return (
        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
          {t('bookStatus.blocked')}
        </span>
      )
    }
    if (book.isBorrowed) {
      return (
        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
          {t('bookStatus.borrowed')}
        </span>
      )
    }
    return (
      <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
        {t('bookStatus.available')}
      </span>
    )
  }

  return (
    <div
      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
      onClick={() => navigate(`/book/${book.id}`, navList ? { state: { navList } } : undefined)}
    >
      {/* Cover thumbnail */}
      {book.cover_url ? (
        <img
          src={book.cover_url}
          className="h-10 w-7 shrink-0 rounded object-cover"
          alt=""
        />
      ) : (
        <div className="h-10 w-7 shrink-0 rounded bg-gray-200" />
      )}

      {/* Title + Author */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900 text-sm">{book.title}</p>
        <p className="truncate text-xs text-gray-500">{book.author}</p>
      </div>

      {/* Owner */}
      <p className="hidden w-28 shrink-0 truncate text-xs text-gray-500 sm:block">
        {book.owner_id === user?.id ? <span className="font-medium">{t('home.me')}</span> : ownerName}
      </p>

      {/* Category */}
      {book.category && (
        <span className="hidden shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 md:inline">
          {t(`categories.${book.category}`)}
        </span>
      )}

      {/* Status */}
      {statusBadge()}

      {/* Listing badge */}
      {book.listing_type && (
        <span
          className={`hidden shrink-0 rounded px-1.5 py-0.5 text-xs sm:inline ${
            book.listing_type === 'gift'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {book.listing_type === 'gift' ? t('bookCard.gift') : t('bookCard.sale')}
        </span>
      )}
    </div>
  )
}
