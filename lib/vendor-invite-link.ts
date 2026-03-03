/**
 * Registrierungslink für Vendors – Supabase Auth Invite/Recovery
 * Erzeugt einen Link, den der Vendor per E-Mail erhält, um sein Passwort zu setzen.
 */

import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const SET_PASSWORD_PATH = '/auth/set-password'

/**
 * Erzeugt einen Registrierungslink für einen Vendor.
 * - Wenn noch kein Auth-User mit der E-Mail existiert: generateLink type 'invite' (erstellt User)
 * - Wenn User existiert (z. B. bei erneutem Senden): generateLink type 'recovery'
 * Gibt { actionLink, userId } zurück. userId ist bei invite der neu erstellte User.
 */
export async function getVendorRegistrationLink(email: string): Promise<{
  actionLink: string | null
  userId: string | null
  error?: string
}> {
  if (!hasSupabaseAdmin()) {
    return { actionLink: null, userId: null, error: 'Service nicht verfügbar' }
  }

  const admin = createSupabaseAdmin()
  const redirectTo = `${BASE_URL.replace(/\/$/, '')}${SET_PASSWORD_PATH}`

  try {
    const trimmedEmail = email.trim().toLowerCase()

    // 1. Invite (erstellt User wenn keiner existiert, gibt Link zurück)
    const { data: inviteData, error: inviteError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: trimmedEmail,
      options: { redirectTo },
    })

    if (!inviteError && inviteData?.properties?.action_link) {
      return {
        actionLink: inviteData.properties.action_link,
        userId: inviteData.user?.id ?? null,
      }
    }

    // 2. Fallback: Recovery (wenn User bereits existiert, z. B. Staff oder früherer Invite)
    const { data: recoveryData, error: recoveryError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: trimmedEmail,
      options: { redirectTo },
    })

    if (!recoveryError && recoveryData?.properties?.action_link) {
      return {
        actionLink: recoveryData.properties.action_link,
        userId: recoveryData.user?.id ?? null,
      }
    }

    return {
      actionLink: null,
      userId: null,
      error: inviteError?.message ?? recoveryError?.message ?? 'Link konnte nicht erstellt werden',
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[vendor-invite-link]', msg)
    return { actionLink: null, userId: null, error: msg }
  }
}
