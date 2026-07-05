import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/Profile'

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, is_admin, approved')
    .eq('id', userId)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}

export async function getOrCreateProfile(user: User): Promise<Profile | null> {
  const existing = await getProfile(user.id)
  if (existing) return existing

  const fallbackName =
    (user.user_metadata?.name as string | undefined) || user.email?.split('@')[0] || 'Usuario'

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, name: fallbackName })
    .select('id, name, is_admin, approved')
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}