export type GoogleBookInfo = {
  title: string
  author: string
  description: string
  coverUrl: string
}

export async function lookupByIsbn(isbn: string): Promise<GoogleBookInfo | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  const keyParam = apiKey ? `&key=${apiKey}` : ''

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}${keyParam}`
  )

  if (res.status === 429) {
    throw new Error(
      'Google Books ha rechazado la búsqueda por límite de uso. Esto puede pasar sin una clave de API configurada.'
    )
  }

  if (!res.ok) throw new Error('Error al consultar Google Books')

  const data = await res.json()
  const info = data.items?.[0]?.volumeInfo

  if (!info) return null

  return {
    title: info.title ?? '',
    author: (info.authors ?? []).join(', '),
    description: stripHtml(info.description ?? ''),
    coverUrl: (info.imageLinks?.thumbnail ?? '').replace('http://', 'https://'),
  }
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
