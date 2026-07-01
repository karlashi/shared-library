import type { Book } from '../types/Books'

export function isBookIncomplete(book: Book): boolean {
  return !book.cover_url || !book.description || !book.age_recommendation || !(book.tags?.length)
}
