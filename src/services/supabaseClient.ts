import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwtvisqhltlloyoblaxn.supabase.co'
const supabaseAnonKey = 'sb_publishable_xq8rcih26s-OQQvs-B9w0g_V5w8OjUg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)