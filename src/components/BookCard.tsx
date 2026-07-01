import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useProfiles, useLendBook, useReturnBook } from '../services/queries'
import { isBookIncomplete } from '../utils/bookCompleteness'
import type { Book } from '../types/Books'

export function BookCard({ book }: { book: Book }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { user, profile } = useAuth()
  const { data: users = [] } = useProfiles()
  const lendBook = useLendBook()
  const returnBook = useReturnBook()
  const [selectedUser, setSelectedUser] = useState('')

  const isOwner = book.owner_id === user?.id
  const isAdmin = !!profile?.is_admin
  const borrowerName = users.find((u) => u.id === book.borrowedBy)?.name ?? t('bookCard.someone')

  const lendToUser = () => {
    if (!selectedUser) return alert(t('bookCard.selectUserAlert'))

    lendBook.mutate(
      { bookId: book.id, borrowerId: selectedUser },
      {
        onSuccess: () => alert(t('bookCard.lendSuccess')),
        onError: (error) => {
          console.error(error)
          alert(t('bookCard.lendError'))
        },
      }
    )
  }

  const markAsReturned = () => {
    if (!book.loanId) return

    returnBook.mutate(book.loanId, {
      onError: (error) => {
        console.error(error)
        alert(t('bookCard.markReturnedError'))
      },
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 shadow-sm">
      {/* CLICK CARD */}
      <div onClick={() => navigate(`/book/${book.id}`)} className="cursor-pointer">
        <div className="flex items-start justify-between gap-1">
          <h4 className="font-semibold text-gray-900 truncate">{book.title}</h4>
          {!book.archived && isBookIncomplete(book) && (
            <span title={t('bookCard.incompleteLabel')} aria-label={t('bookCard.incompleteLabel')}>
              ⚠️
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 truncate">{book.author}</p>

        {book.cover_url && (
          <img
            src={book.cover_url}
            className="mt-2 w-full rounded-md aspect-[2/3] object-cover"
          />
        )}
      </div>

      {/* BORROWED STATUS */}
      {book.isBorrowed && (
        <p className="mt-2 text-xs text-gray-600">
          📕 {t('bookCard.lentTo')} {borrowerName}
        </p>
      )}

      {/* LISTING (GIFT/SALE) STATUS */}
      {book.listing_type && (
        <p className="mt-2 text-xs">
          <span
            className={
              book.listing_type === 'gift'
                ? 'rounded bg-purple-100 px-1.5 py-0.5 text-purple-800'
                : 'rounded bg-amber-100 px-1.5 py-0.5 text-amber-800'
            }
          >
            {book.listing_type === 'gift' ? t('bookCard.gift') : t('bookCard.sale')}
          </span>
          {book.listing_comment && <span className="ml-1 text-gray-600">{book.listing_comment}</span>}
        </p>
      )}

      {/* OWNER/ADMIN RETURN CONTROL */}
      {(isOwner || isAdmin) && book.isBorrowed && (
        <div className="mt-2">
          <button
            onClick={markAsReturned}
            disabled={returnBook.isPending}
            className="w-full rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200 disabled:opacity-50"
          >
            {t('bookCard.markReturned')}
          </button>
        </div>
      )}

      {/* OWNER LEND CONTROL */}
      {isOwner && !book.isBorrowed && (
        <div className="mt-2">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">{t('bookCard.lendToPlaceholder')}</option>

            {users.filter((u) => u.id !== user?.id).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <button
            onClick={lendToUser}
            className="mt-1.5 w-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            {t('bookCard.lend')}
          </button>
        </div>
      )}
    </div>
  )
}
