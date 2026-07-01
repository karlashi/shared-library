import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

type FormValues = {
  name: string
}

export function ProfilePage() {
  const navigate = useNavigate()
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

  const myBooks = books.filter((b) => b.owner_id === user?.id)

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
        <button
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          ← Volver
        </button>

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

        {/* HISTORY: BORROWED BY ME */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">📕 Libros que he pedido prestados</h2>
        {borrowedByMe.length === 0 ? (
          <p className="mb-8 text-gray-600">No has pedido prestado ningún libro todavía.</p>
        ) : (
          <ul className="mb-8 space-y-1 pl-5 text-gray-700">
            {borrowedByMe.map((loan) => {
              const book = getBookById(loan.book_id)
              return (
                <li key={loan.id}>
                  <b>{book?.title ?? 'Libro desconocido'}</b>
                  {book && ` — ${book.author}`}
                  {' · '}
                  Propietario: {book ? getProfileName(book.owner_id ?? '') : 'Desconocido'}
                  {' · '}
                  {loan.returned_at ? 'Devuelto' : 'Activo'}
                  {' · '}
                  Prestado: {formatDate(loan.borrowed_at)}
                  {loan.returned_at && ` · Devuelto: ${formatDate(loan.returned_at)}`}
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
          <ul className="space-y-1 pl-5 text-gray-700">
            {lentByMe.map((loan) => {
              const book = getBookById(loan.book_id)
              return (
                <li key={loan.id}>
                  <b>{book?.title ?? 'Libro desconocido'}</b>
                  {' · '}
                  Prestado a: {getProfileName(loan.borrower_id)}
                  {' · '}
                  {loan.returned_at ? (
                    'Devuelto'
                  ) : (
                    <>
                      Activo{' '}
                      <button
                        onClick={() => handleReturn(loan.id)}
                        disabled={returnBook.isPending}
                        className="ml-2 rounded-md bg-gray-100 px-2 py-0.5 text-sm text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                      >
                        Marcar como devuelto
                      </button>
                    </>
                  )}
                  {' · '}
                  Prestado: {formatDate(loan.borrowed_at)}
                  {loan.returned_at && ` · Devuelto: ${formatDate(loan.returned_at)}`}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
