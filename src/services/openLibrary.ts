export type OpenLibraryExtras = {
  coverUrl?: string
  description?: string
}

// Best-effort fallback source — Open Library's per-edition data is inconsistent (many
// editions have no description at all), so failures here are swallowed rather than
// surfaced, and callers should treat every field as "maybe present."
export async function lookupOpenLibraryExtras(isbn: string): Promise<OpenLibraryExtras> {
  const result: OpenLibraryExtras = {}

  try {
    const coverRes = await fetch(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`)
    if (coverRes.ok) result.coverUrl = coverRes.url
  } catch {
    // ignore — cover fallback is optional
  }

  try {
    const editionRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
    if (editionRes.ok) {
      const data = await editionRes.json()
      if (typeof data.description === 'string') result.description = data.description
      else if (typeof data.description?.value === 'string') result.description = data.description.value
    }
  } catch {
    // ignore — description fallback is optional
  }

  return result
}
