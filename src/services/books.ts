import { supabase } from './supabaseClient'

export async function getBooks() {
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('*')

  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .is('returned_at', null)

  if (booksError || loansError) {
    console.error(booksError || loansError)
    return []
  }

  // attach loan info to each book
  const enriched = books.map(book => {
    const activeLoan = loans.find(l => l.book_id === book.id)

    return {
      ...book,
      isBorrowed: !!activeLoan,
      borrowedBy: activeLoan?.borrower_id || null
    }
  })

  return enriched
}