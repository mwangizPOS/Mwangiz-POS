import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Projections will not load.')
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
    global: {
      headers: {
        'x-client-info': 'mwangiz-salon-pos',
      },
    },
  }
)

export function setSupabaseAuthToken(token: string | null) {
  if (token) {
    // We update the authorization header so postgREST applies RLS if configured
    supabase.realtime.setAuth(token)
    // For REST requests
    ;(supabase as any).rest.headers['Authorization'] = `Bearer ${token}`
  } else {
    supabase.realtime.setAuth(null)
    delete (supabase as any).rest.headers['Authorization']
  }
}
