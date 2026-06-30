export type Book = {
  id: string
  title: string
  author: string
  cover_url?: string
  status?: string
  owner_id?: string

  // NEW FIELDS
  isBorrowed?: boolean
  borrowedBy?: string | null
}