import { lookupByIsbn, type GoogleBookInfo } from './googleBooks'
import { lookupOpenLibraryExtras } from './openLibrary'

export async function lookupBookInfo(isbn: string): Promise<GoogleBookInfo | null> {
  const google = await lookupByIsbn(isbn)
  if (!google) return null

  if (!google.coverUrl || !google.description) {
    const extra = await lookupOpenLibraryExtras(isbn)
    return {
      ...google,
      coverUrl: google.coverUrl || extra.coverUrl || '',
      description: google.description || extra.description || '',
    }
  }

  return google
}
