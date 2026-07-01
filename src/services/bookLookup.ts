import { lookupByIsbn, lookupByTitleAuthor, type GoogleBookInfo } from './googleBooks'
import { lookupOpenLibraryExtras } from './openLibrary'

async function augmentWithOpenLibrary(
  google: GoogleBookInfo | null,
  isbn?: string
): Promise<GoogleBookInfo | null> {
  if (!google) return null

  if ((!google.coverUrl || !google.description) && isbn) {
    const extra = await lookupOpenLibraryExtras(isbn)
    return {
      ...google,
      coverUrl: google.coverUrl || extra.coverUrl || '',
      description: google.description || extra.description || '',
    }
  }

  return google
}

export async function lookupBookInfo(isbn: string): Promise<GoogleBookInfo | null> {
  const google = await lookupByIsbn(isbn)
  return augmentWithOpenLibrary(google, isbn)
}

// Fallback for books with no ISBN on file — searches Google Books by title/author instead.
// If that search happens to surface an ISBN, the Open Library cover/description fallback
// still applies; otherwise only whatever Google Books itself returned is used.
export async function lookupBookInfoByTitleAuthor(title: string, author: string): Promise<GoogleBookInfo | null> {
  const google = await lookupByTitleAuthor(title, author)
  return augmentWithOpenLibrary(google, google?.isbn)
}
