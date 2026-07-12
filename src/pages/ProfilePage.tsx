import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  useBooks,
  useProfiles,
  useAllLoans,
  useUpdateProfile,
  useReturnBook,
  useDeleteAccount,
  useWishlist,
  useApproveProfile,
} from '../services/queries'
import { BookCard } from '../components/BookCard'
import { Header } from '../components/Header'

type FormValues = {
  name: string
}

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const isAdmin = !!profile?.is_admin

  const { data: books = [] } = useBooks()
  const { data: profiles = [] } = useProfiles()
  const { data: loans = [] } = useAllLoans()
  const { data: wishlist = [] } = useWishlist(user?.id)

  const updateProfile = useUpdateProfile()
  const returnBook = useReturnBook()
  const deleteAccount = useDeleteAccount()
  const approveProfile = useApproveProfile()

  const pendingProfiles = profiles.filter((p) => !p.approved)

  const handleApprove = (userId: string) => {
    approveProfile.mutate(userId, {
      onError: (error) => {
        console.error(error)
        alert(t('profile.approveError'))
      },
    })
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { name: profile?.name ?? '' } })

  useEffect(() => {
    if (profile) reset({ name: profile.name })
  }, [profile, reset])

  const getBookById = (id: string) => books.find((b) => b.id === id)
  const getProfileName = (id: string) =>
    profiles.find((p) => p.id === id)?.name ?? t('common.unknown')
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const wishlistedBooks = books.filter((b) => wishlist.includes(b.id))

  const borrowedByMe = loans.filter((l) => l.borrower_id === user?.id)

  const lentByMe = loans.filter((l) => getBookById(l.book_id)?.owner_id === user?.id)

  const onSaveName = (values: FormValues) => {
    if (!user) return

    updateProfile.mutate(
      { userId: user.id, name: values.name },
      {
        onError: (error) => {
          console.error(error)
          alert(t('profile.updateProfileError'))
        },
      }
    )
  }

  const handleReturn = (loanId: string) => {
    returnBook.mutate(loanId, {
      onError: (error) => {
        console.error(error)
        alert(t('profile.markReturnedError'))
      },
    })
  }

  const handleDeleteAccount = () => {
    if (!window.confirm(t('profile.deleteAccountConfirm'))) {
      return
    }

    deleteAccount.mutate(undefined, {
      onSuccess: async () => {
        await signOut()
        navigate('/login')
      },
      onError: (error) => {
        console.error(error)
        alert(error instanceof Error ? error.message : t('profile.deleteAccountError'))
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">{t('profile.heading')}</h1>

        {/* EDIT NAME */}
        <form onSubmit={handleSubmit(onSaveName)} className="mb-8 max-w-xs">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('profile.nameLabel')}</span>
            <input
              {...register('name', { required: t('profile.nameRequired') })}
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.name && <p className="mb-2 -mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </label>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {updateProfile.isPending ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </form>

        {/* PENDING MEMBER APPROVAL (admin only) */}
        {isAdmin && pendingProfiles.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.pendingMembers')}</h2>
            <ul className="space-y-2">
              {pendingProfiles.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={approveProfile.isPending}
                    className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {t('profile.approve')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* WISHLIST */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.wishlist')}</h2>
        {wishlistedBooks.length === 0 ? (
          <p className="mb-8 text-gray-600">{t('profile.noWishlistYet')}</p>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {wishlistedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* HISTORY: BORROWED BY ME */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.borrowedByMe')}</h2>
        {borrowedByMe.length === 0 ? (
          <p className="mb-8 text-gray-600">{t('profile.noBorrowedYet')}</p>
        ) : (
          <ul className="mb-8 space-y-3">
            {borrowedByMe.map((loan) => {
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
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">{t('profile.owner')}</dt>
                      <dd>{book ? getProfileName(book.owner_id ?? '') : t('common.unknown')}</dd>
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

        {/* HISTORY: LENT BY ME */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.lentByMe')}</h2>
        {lentByMe.length === 0 ? (
          <p className="text-gray-600">{t('profile.noLentYet')}</p>
        ) : (
          <ul className="space-y-3">
            {lentByMe.map((loan) => {
              const book = getBookById(loan.book_id)
              return (
                <li key={loan.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{book?.title ?? t('profile.unknownBook')}</p>
                    {loan.returned_at ? (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-sm text-green-800">{t('profile.returned')}</span>
                    ) : (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-sm text-red-800">{t('profile.active')}</span>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">{t('profile.lentTo')}</dt>
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
                  {!loan.returned_at && (
                    <button
                      onClick={() => handleReturn(loan.id)}
                      disabled={returnBook.isPending}
                      className="mt-3 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                    >
                      {t('profile.markReturned')}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* DANGER ZONE */}
        <div className="mt-10 rounded-lg border border-red-300 p-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('profile.deleteAccountHeading')}</h2>
          <p className="mb-3 text-sm text-gray-600">
            {t('profile.deleteAccountDescription')}
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteAccount.isPending}
            className="rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteAccount.isPending ? t('profile.deletingAccount') : t('profile.deleteAccountButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
