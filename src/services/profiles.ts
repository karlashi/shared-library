import { supabase } from './supabaseClient'
import type { Profile } from '../types/Profile'

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}