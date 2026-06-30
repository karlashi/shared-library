import { supabase } from './supabaseClient'

export async function lendBook(bookId: string, borrowerId: string) {
  const { error } = await supabase.from('loans').insert({
    book_id: bookId,
    borrower_id: borrowerId,
  })

  if (error) throw error
}
