import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabaseClient'
import { getBooks } from './books'
import { getProfile } from './profiles'
import { lendBook, returnBook } from './loans'
import type { Book } from '../types/Books'
import type { Profile } from '../types/Profile'
import type { Loan } from '../types/Loan'

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
      const { data, error } = await supabase.from('profiles').select('*')
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

export function useAllTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('books').select('tags')
      if (error) throw error
      const all = (data ?? []).flatMap((b) => b.tags ?? [])
      return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, 'es'))
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
