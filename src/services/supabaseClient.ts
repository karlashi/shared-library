import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detect missing or placeholder values that can come from a misconfigured Vercel integration.
const isLikelyPlaceholder = (val: unknown) => {
  if (!val || typeof val !== 'string') return true
  // Common accidental values: the literal env var name copied into Vercel, or other VITE_ placeholders
  if (val === 'VITE_SUPABASE_ANON_KEY') return true
  if (val.startsWith('VITE_')) return true
  return false
}

if (!supabaseUrl || isLikelyPlaceholder(supabaseAnonKey)) {
  // Provide a clear message in both console logs and the thrown error so Vercel build logs / browser console make the problem obvious.
  const guidance = `Missing or invalid Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set to the actual values from Supabase → Settings → API (not the literal variable names). On Vercel, add them under Settings → Environment Variables for Production, Preview and Development and then redeploy.`
  // eslint-disable-next-line no-console
  console.error('Supabase configuration error: ' + guidance)
  throw new Error('Supabase configuration error: ' + guidance)
}

// Log the Base URL and a masked anon key presence for quick runtime debugging (mask full key)
const mask = (s?: string) => (s ? `${s.slice(0, 4)}…(${s.length} chars)` : 'missing')
// eslint-disable-next-line no-console
console.info(`[supabase] URL=${mask(supabaseUrl)}, anonKey=${mask(supabaseAnonKey)}`)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // Ensure the anon key is sent with every request. This is safe for the anon key (public client key).
    headers: {
      apikey: supabaseAnonKey,
      // Do NOT set Authorization here — supabase-js will attach the user's access token when available.
    },
  },
})