import { supabase } from './supabaseClient'
import { deleteCoverImage } from './storage'
import type { Book } from '../types/Books'

export async function getBooks(): Promise<Book[]> {
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('*')

  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .is('returned_at', null)

  if (booksError || loansError || !books) {
    console.error(booksError || loansError)
    return []
  }

  // attach loan info to each book
  const enriched = books.map(book => {
    const activeLoan = loans?.find(l => l.book_id === book.id)

    return {
      ...book,
      isBorrowed: !!activeLoan,
      borrowedBy: activeLoan?.borrower_id || null,
      loanId: activeLoan?.id || null
    }
  })

  return enriched
}

export async function deleteBook(bookId: string, coverUrl?: string | null) {
  const { count, error: countError } = await supabase
    .from('loans')
    .select('id', { count: 'exact', head: true })
    .eq('book_id', bookId)

  if (countError) throw countError
  if (count && count > 0) {
    throw new Error('Este libro tiene historial de préstamos y no se puede eliminar.')
  }

  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) throw error

  if (coverUrl) await deleteCoverImage(coverUrl)
}