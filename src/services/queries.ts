import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { getBooks, deleteBook } from './books'
import { getProfile } from './profiles'
import { lendBook, returnBook } from './loans'
import type { Book } from '../types/Books'
import type { Profile } from '../types/Profile'
import type { Loan } from '../types/Loan'
import type { BookTag } from '../types/BookTag'
import type { BookComment } from '../types/BookComment'

export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: getBooks,
  })
}

export function useBook(id: string | undefined) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: async (): Promise<Book> => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profiles', userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.from('profiles').select('id, name, is_admin, approved')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useBookLoan(bookId: string | undefined) {
  return useQuery({
    queryKey: ['loans', 'book', bookId],
    queryFn: async (): Promise<Loan | null> => {
      const { data } = await supabase
        .from('loans')
        .select('*')
        .eq('book_id', bookId)
        .is('returned_at', null)
        .maybeSingle()
      return data
    },
    enabled: !!bookId,
  })
}

export function useLendBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { bookId: string; borrowerId: string }) =>
      lendBook(vars.bookId, vars.borrowerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export function useAllLoans() {
  return useQuery({
    queryKey: ['loans', 'all'],
    queryFn: async (): Promise<Loan[]> => {
      const { data, error } = await supabase.from('loans').select('*')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useReturnBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (loanId: string) => returnBook(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { bookId: string; coverUrl?: string | null }) =>
      deleteBook(vars.bookId, vars.coverUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useSetArchived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { bookId: string; archived: boolean }) => {
      const { error } = await supabase
        .from('books')
        .update({ archived: vars.archived })
        .eq('id', vars.bookId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useTransferBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { bookId: string; newOwnerId: string }) => {
      const { error } = await supabase
        .from('books')
        .update({ owner_id: vars.newOwnerId, listing_type: null, listing_comment: null })
        .eq('id', vars.bookId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useAllTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('book_tags').select('tag')
      if (error) throw error
      const all = (data ?? []).map((row) => row.tag)
      return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, 'es'))
    },
  })
}

export function useBookTags(bookId: string | undefined) {
  return useQuery({
    queryKey: ['book_tags', bookId],
    queryFn: async (): Promise<BookTag[]> => {
      const { data, error } = await supabase
        .from('book_tags')
        .select('*')
        .eq('book_id', bookId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!bookId,
  })
}

export function useAddTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { bookId: string; tag: string; userId: string }) => {
      const { error } = await supabase.from('book_tags').insert({
        book_id: vars.bookId,
        tag: vars.tag,
        added_by: vars.userId,
      })
      if (error && error.code !== '23505') throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['book_tags', vars.bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useRemoveTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { bookId: string; tag: string }) => {
      const { error } = await supabase
        .from('book_tags')
        .delete()
        .eq('book_id', vars.bookId)
        .eq('tag', vars.tag)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['book_tags', vars.bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useBookComments(bookId: string | undefined) {
  return useQuery({
    queryKey: ['book_comments', bookId],
    queryFn: async (): Promise<BookComment[]> => {
      const { data, error } = await supabase
        .from('book_comments')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!bookId,
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { bookId: string; userId: string; comment: string }) => {
      const { error } = await supabase
        .from('book_comments')
        .insert({ book_id: vars.bookId, user_id: vars.userId, comment: vars.comment })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['book_comments', vars.bookId] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: string; bookId: string; comment: string }) => {
      const { error } = await supabase
        .from('book_comments')
        .update({ comment: vars.comment, updated_at: new Date().toISOString() })
        .eq('id', vars.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['book_comments', vars.bookId] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: string; bookId: string }) => {
      const { error } = await supabase.from('book_comments').delete().eq('id', vars.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['book_comments', vars.bookId] })
    },
  })
}

export function useWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('wishlist')
        .select('book_id')
        .eq('user_id', userId)
      if (error) throw error
      return (data ?? []).map((row) => row.book_id)
    },
    enabled: !!userId,
  })
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { bookId: string; userId: string; wishlisted: boolean }) => {
      if (vars.wishlisted) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('book_id', vars.bookId)
          .eq('user_id', vars.userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ book_id: vars.bookId, user_id: vars.userId })
        if (error && error.code !== '23505') throw error
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', vars.userId] })
    },
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_own_account')
      if (error) throw error
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { userId: string; name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name: vars.name })
        .eq('id', vars.userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useApproveProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}
