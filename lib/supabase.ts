import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Create clients only if we have valid environment variables
// During build, if env vars are missing, create placeholder clients
const getSupabaseUrl = () => supabaseUrl || 'https://placeholder.supabase.co'
const getSupabaseAnonKey = () => supabaseAnonKey || 'placeholder-anon-key'
const getSupabaseServiceKey = () => supabaseServiceRoleKey || 'placeholder-service-key'

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())

// For server-side operations with service role key
export const supabaseAdmin = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)







