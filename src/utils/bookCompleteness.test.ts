import { describe, it, expect } from 'vitest'
import { isBookIncomplete } from './bookCompleteness'
import type { Book } from '../types/Books'

const completeBook: Book = {
  id: '1',
  title: 'Test',
  author: 'Author',
  cover_url: 'https://example.com/cover.jpg',
  description: 'A description',
  age_recommendation: '8+',
  tags: ['aventura'],
  category: 'infantil',
}

describe('isBookIncomplete', () => {
  it('returns false when cover, description, age, tags, and category are all present', () => {
    expect(isBookIncomplete(completeBook)).toBe(false)
  })

  it('returns true when category is missing', () => {
    expect(isBookIncomplete({ ...completeBook, category: undefined })).toBe(true)
  })

  it('returns true when cover_url is missing', () => {
    expect(isBookIncomplete({ ...completeBook, cover_url: undefined })).toBe(true)
  })

  it('returns true when description is missing', () => {
    expect(isBookIncomplete({ ...completeBook, description: undefined })).toBe(true)
  })

  it('returns true when age_recommendation is missing', () => {
    expect(isBookIncomplete({ ...completeBook, age_recommendation: undefined })).toBe(true)
  })

  it('returns true when there are no tags', () => {
    expect(isBookIncomplete({ ...completeBook, tags: [] })).toBe(true)
  })

  it('returns true when tags is undefined', () => {
    expect(isBookIncomplete({ ...completeBook, tags: undefined })).toBe(true)
  })
})
