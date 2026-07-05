export type Book = {
  id: string
  title: string
  author: string
  cover_url?: string
  status?: string
  owner_id?: string
  collection?: string
  link?: string
  age_recommendation?: string
  tags?: string[]
  isbn?: string
  description?: string
  created_at?: string
  listing_type?: 'gift' | 'sale' | null
  listing_comment?: string | null
  archived?: boolean
  category?: string | null

  isBorrowed?: boolean
  borrowedBy?: string | null
  loanId?: string | null
}