import { createClient } from '@supabase/supabase-js'

/**
 * Supabase-Client mit Service-Role-Key fuer Backend-Aktionen ohne User-Session.
 * Nur verwenden, wenn SUPABASE_SERVICE_ROLE_KEY gesetzt ist.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY und NEXT_PUBLIC_SUPABASE_URL muessen gesetzt sein.')
  }
  return createClient(url, key)
}

export function hasSupabaseAdmin(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
