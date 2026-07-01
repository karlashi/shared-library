import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteBook } from './books'

const mockEq = vi.fn()
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockDeleteEq = vi.fn()
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      delete: mockDelete,
    })),
  },
}))

vi.mock('./storage', () => ({
  deleteCoverImage: vi.fn(),
}))

describe('deleteBook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws a friendly error when the book has loan history', async () => {
    mockEq.mockResolvedValue({ count: 2, error: null })

    await expect(deleteBook('book-1')).rejects.toThrow(
      'Este libro tiene historial de préstamos y no se puede eliminar.'
    )
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes the book when it has no loan history', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null })
    mockDeleteEq.mockResolvedValue({ error: null })

    await expect(deleteBook('book-1')).resolves.toBeUndefined()
    expect(mockDelete).toHaveBeenCalled()
  })
})
