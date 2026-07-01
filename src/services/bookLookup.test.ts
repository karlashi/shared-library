import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupBookInfo, lookupBookInfoByTitleAuthor } from './bookLookup'
import { lookupByIsbn, lookupByTitleAuthor } from './googleBooks'
import { lookupOpenLibraryExtras } from './openLibrary'

vi.mock('./googleBooks', () => ({ lookupByIsbn: vi.fn(), lookupByTitleAuthor: vi.fn() }))
vi.mock('./openLibrary', () => ({ lookupOpenLibraryExtras: vi.fn() }))

const mockedLookupByIsbn = vi.mocked(lookupByIsbn)
const mockedLookupByTitleAuthor = vi.mocked(lookupByTitleAuthor)
const mockedLookupOpenLibraryExtras = vi.mocked(lookupOpenLibraryExtras)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('lookupBookInfo', () => {
  it('returns null when Google Books has no result, without calling Open Library', async () => {
    mockedLookupByIsbn.mockResolvedValue(null)

    const result = await lookupBookInfo('0000000000')

    expect(result).toBeNull()
    expect(mockedLookupOpenLibraryExtras).not.toHaveBeenCalled()
  })

  it('does not call Open Library when Google Books already has cover and description', async () => {
    mockedLookupByIsbn.mockResolvedValue({
      title: 'A Book', author: 'An Author', description: 'Full description', coverUrl: 'https://cover.example/a.jpg',
    })

    const result = await lookupBookInfo('1111111111')

    expect(result?.coverUrl).toBe('https://cover.example/a.jpg')
    expect(result?.description).toBe('Full description')
    expect(mockedLookupOpenLibraryExtras).not.toHaveBeenCalled()
  })

  it('fills in a missing cover and description from Open Library', async () => {
    mockedLookupByIsbn.mockResolvedValue({
      title: 'A Book', author: 'An Author', description: '', coverUrl: '',
    })
    mockedLookupOpenLibraryExtras.mockResolvedValue({
      coverUrl: 'https://covers.openlibrary.org/b/isbn/1111111111-L.jpg',
      description: 'From Open Library',
    })

    const result = await lookupBookInfo('1111111111')

    expect(result?.coverUrl).toBe('https://covers.openlibrary.org/b/isbn/1111111111-L.jpg')
    expect(result?.description).toBe('From Open Library')
  })

  it('keeps Google Books data when Open Library has nothing to add', async () => {
    mockedLookupByIsbn.mockResolvedValue({
      title: 'A Book', author: 'An Author', description: '', coverUrl: '',
    })
    mockedLookupOpenLibraryExtras.mockResolvedValue({})

    const result = await lookupBookInfo('1111111111')

    expect(result?.coverUrl).toBe('')
    expect(result?.description).toBe('')
  })
})

describe('lookupBookInfoByTitleAuthor', () => {
  it('returns null when Google Books has no match', async () => {
    mockedLookupByTitleAuthor.mockResolvedValue(null)

    const result = await lookupBookInfoByTitleAuthor('Some Title', 'Some Author')

    expect(result).toBeNull()
    expect(mockedLookupOpenLibraryExtras).not.toHaveBeenCalled()
  })

  it('augments with Open Library using the ISBN Google Books found via search', async () => {
    mockedLookupByTitleAuthor.mockResolvedValue({
      title: 'Some Title', author: 'Some Author', description: '', coverUrl: '', isbn: '2222222222',
    })
    mockedLookupOpenLibraryExtras.mockResolvedValue({
      coverUrl: 'https://covers.openlibrary.org/b/isbn/2222222222-L.jpg',
    })

    const result = await lookupBookInfoByTitleAuthor('Some Title', 'Some Author')

    expect(mockedLookupOpenLibraryExtras).toHaveBeenCalledWith('2222222222')
    expect(result?.coverUrl).toBe('https://covers.openlibrary.org/b/isbn/2222222222-L.jpg')
  })

  it('skips Open Library entirely when the search result has no ISBN', async () => {
    mockedLookupByTitleAuthor.mockResolvedValue({
      title: 'Some Title', author: 'Some Author', description: '', coverUrl: '',
    })

    const result = await lookupBookInfoByTitleAuthor('Some Title', 'Some Author')

    expect(mockedLookupOpenLibraryExtras).not.toHaveBeenCalled()
    expect(result?.coverUrl).toBe('')
  })
})
