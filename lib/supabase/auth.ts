import { supabase } from '@/lib/supabase'
import { OWNER_EMAIL } from '@/lib/owner-email'

/**
 * Prüft ob der aktuelle User Inhaber ist (volle Admin-Rechte ohne Staff-Eintrag).
 */
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
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

/**
 * Passwort-zurücksetzen-Mail anfordern („Passwort vergessen“).
 * redirectTo = URL, an der der Nutzer nach Klick auf den Link landet (z. B. /login/set-password).
 */
export async function requestPasswordReset(email: string, redirectTo: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo.startsWith('http') ? redirectTo : undefined,
  })
  if (error) throw error
}

/**
 * Neues Passwort setzen (nach Einladung oder Passwort-Reset).
 * Nur gültig, wenn die Session durch Einladungs- oder Reset-Link entstanden ist.
 */
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
