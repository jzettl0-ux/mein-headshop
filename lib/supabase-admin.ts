import { createClient } from '@supabase/supabase-js'

function getServiceRoleKey(): string | null {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!k || typeof k !== 'string' || k.trim() === '' || k.toLowerCase() === 'undefined') return null
  return k.trim()
}

/**
 * Supabase-Client mit Service-Role-Key fuer Backend-Aktionen ohne User-Session.
 * Nur verwenden, wenn SUPABASE_SERVICE_ROLE_KEY in .env.local gesetzt ist.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = getServiceRoleKey()
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY und NEXT_PUBLIC_SUPABASE_URL muessen in .env.local gesetzt sein (Service-Role-Key unter Supabase → Project Settings → API).')
  }
  return createClient(url, key)
}

export function hasSupabaseAdmin(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && getServiceRoleKey())
}
