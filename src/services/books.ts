import { supabase } from './supabaseClient'
import { deleteCoverImage } from './storage'
import i18n from '../i18n'
import type { Book } from '../types/Books'

export async function getBooks(): Promise<Book[]> {
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('*')

  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .is('returned_at', null)

  const { data: bookTags, error: tagsError } = await supabase
    .from('book_tags')
    .select('book_id, tag')

  if (booksError || loansError || tagsError || !books) {
    console.error(booksError || loansError || tagsError)
    return []
  }

  // attach loan info and tags to each book
  const enriched = books.map(book => {
    const activeLoan = loans?.find(l => l.book_id === book.id)
    const tags = (bookTags ?? []).filter(t => t.book_id === book.id).map(t => t.tag)

    return {
      ...book,
      isBorrowed: !!activeLoan,
      borrowedBy: activeLoan?.borrower_id || null,
      loanId: activeLoan?.id || null,
      tags
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
    throw new Error(i18n.t('errors.bookHasLoanHistory'))
  }

  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) throw error

  if (coverUrl) await deleteCoverImage(coverUrl)
}