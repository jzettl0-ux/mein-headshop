import { supabase } from '@/lib/supabase'

// Admin E-Mail - nur diese E-Mail hat Admin-Zugriff
export const ADMIN_EMAIL = 'jzettl0@gmail.com'

/**
 * Prüft ob der aktuelle User ein Admin ist
 */
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

/**
 * Prüft ob ein User eingeloggt ist
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

/**
 * Login mit E-Mail und Passwort
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/**
 * Logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Aktuellen User holen
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Auth State Listener
 */
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
