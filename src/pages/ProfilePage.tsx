import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import {
  useBooks,
  useProfiles,
  useAllLoans,
  useUpdateProfile,
  useReturnBook,
} from '../services/queries'
import { BookCard } from '../components/BookCard'
import { Header } from '../components/Header'

type FormValues = {
  name: string
}

export function ProfilePage() {
  const { user, profile } = useAuth()

  const { data: books = [] } = useBooks()
  const { data: profiles = [] } = useProfiles()
  const { data: loans = [] } = useAllLoans()

  const updateProfile = useUpdateProfile()
  const returnBook = useReturnBook()

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
    profiles.find((p) => p.id === id)?.name ?? 'Desconocido'
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const myBooks = books.filter((b) => b.owner_id === user?.id && !b.archived)
  const myArchivedBooks = books.filter((b) => b.owner_id === user?.id && b.archived)

  const borrowedByMe = loans.filter((l) => l.borrower_id === user?.id)

  const lentByMe = loans.filter((l) => getBookById(l.book_id)?.owner_id === user?.id)

  const onSaveName = (values: FormValues) => {
    if (!user) return

    updateProfile.mutate(
      { userId: user.id, name: values.name },
      {
        onError: (error) => {
          console.error(error)
          alert('Error al actualizar el perfil')
        },
      }
    )
  }

  const handleReturn = (loanId: string) => {
    returnBook.mutate(loanId, {
      onError: (error) => {
        console.error(error)
        alert('Error al marcar el libro como devuelto')
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">👤 Mi perfil</h1>

        {/* EDIT NAME */}
        <form onSubmit={handleSubmit(onSaveName)} className="mb-8 max-w-xs">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Nombre</span>
            <input
              {...register('name', { required: 'El nombre es obligatorio' })}
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.name && <p className="mb-2 -mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </label>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        {/* MY BOOKS */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">📚 Mis libros</h2>
        {myBooks.length === 0 ? (
          <p className="mb-8 text-gray-600">Todavía no has añadido ningún libro.</p>
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
            <h2 className="mb-3 text-lg font-semibold text-gray-900">📦 Archivados</h2>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {myArchivedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}

        {/* HISTORY: BORROWED BY ME */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">📕 Libros que he pedido prestados</h2>
        {borrowedByMe.length === 0 ? (
          <p className="mb-8 text-gray-600">No has pedido prestado ningún libro todavía.</p>
        ) : (
          <ul className="mb-8 space-y-3">
            {borrowedByMe.map((loan) => {
              const book = getBookById(loan.book_id)
              return (
                <li key={loan.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">
                      {book?.title ?? 'Libro desconocido'}
                      {book && <span className="font-normal text-gray-600"> — {book.author}</span>}
                    </p>
                    {loan.returned_at ? (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-sm text-green-800">Devuelto</span>
                    ) : (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-sm text-red-800">Activo</span>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">Propietario</dt>
                      <dd>{book ? getProfileName(book.owner_id ?? '') : 'Desconocido'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Prestado</dt>
                      <dd>{formatDate(loan.borrowed_at)}</dd>
                    </div>
                    {loan.returned_at && (
                      <div>
                        <dt className="text-gray-500">Devuelto</dt>
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
        <h2 className="mb-3 text-lg font-semibold text-gray-900">📗 Libros que he prestado</h2>
        {lentByMe.length === 0 ? (
          <p className="text-gray-600">No has prestado ningún libro todavía.</p>
        ) : (
          <ul className="space-y-3">
            {lentByMe.map((loan) => {
              const book = getBookById(loan.book_id)
              return (
                <li key={loan.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{book?.title ?? 'Libro desconocido'}</p>
                    {loan.returned_at ? (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-sm text-green-800">Devuelto</span>
                    ) : (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-sm text-red-800">Activo</span>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-3">
                    <div>
                      <dt className="text-gray-500">Prestado a</dt>
                      <dd>{getProfileName(loan.borrower_id)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Prestado</dt>
                      <dd>{formatDate(loan.borrowed_at)}</dd>
                    </div>
                    {loan.returned_at && (
                      <div>
                        <dt className="text-gray-500">Devuelto</dt>
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
                      Marcar como devuelto
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
