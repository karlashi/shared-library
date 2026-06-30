import { supabase } from './supabaseClient'

export async function getProfile(userId: string) {
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