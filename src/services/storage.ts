import { supabase } from './supabaseClient'
import i18n from '../i18n'

const BUCKET = 'book-covers'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return i18n.t('errors.notAnImage')
  if (file.size > MAX_SIZE) return i18n.t('errors.imageTooLarge')
  return null
}

export async function uploadCoverImage(file: File): Promise<string> {
  const fileName = `${crypto.randomUUID()}-${file.name}`

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

export async function deleteCoverImage(coverUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`
  const index = coverUrl.indexOf(marker)
  if (index === -1) return // not one of our own uploads (e.g. an ISBN-lookup cover URL)

  const path = decodeURIComponent(coverUrl.slice(index + marker.length))
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) console.error(error) // best-effort cleanup, never blocks the caller
}
