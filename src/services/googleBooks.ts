import i18n from '../i18n'

export type GoogleBookInfo = {
  title: string
  author: string
  description: string
  coverUrl: string
  isbn?: string
}

async function fetchGoogleBooksQuery(query: string): Promise<GoogleBookInfo | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  const keyParam = apiKey ? `&key=${apiKey}` : ''

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}${keyParam}`)

  if (res.status === 429) {
    throw new Error(i18n.t('errors.googleBooksRateLimited'))
  }

  if (!res.ok) throw new Error(i18n.t('errors.googleBooksLookupFailed'))

  const data = await res.json()
  const info = data.items?.[0]?.volumeInfo

  if (!info) return null

  const identifiers = info.industryIdentifiers ?? []
  const isbn = identifiers.find((id: { type: string }) => id.type === 'ISBN_13')?.identifier
    ?? identifiers[0]?.identifier

  return {
    title: info.title ?? '',
    author: (info.authors ?? []).join(', '),
    description: stripHtml(info.description ?? ''),
    coverUrl: (info.imageLinks?.thumbnail ?? '').replace('http://', 'https://'),
    isbn,
  }
}

export async function lookupByIsbn(isbn: string): Promise<GoogleBookInfo | null> {
  const result = await fetchGoogleBooksQuery(`isbn:${encodeURIComponent(isbn)}`)
  return result ? { ...result, isbn: result.isbn ?? isbn } : null
}

export async function lookupByTitleAuthor(title: string, author: string): Promise<GoogleBookInfo | null> {
  const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
  return fetchGoogleBooksQuery(query)
}

// Google Books descriptions are HTML-formatted (b/i/br tags) — reduce to plain text
// since the app only ever renders this in a plain textarea/paragraph.
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
