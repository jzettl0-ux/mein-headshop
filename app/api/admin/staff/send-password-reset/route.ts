import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { hasPasswordResetEmail, sendPasswordResetEmail } from '@/lib/send-password-reset-email'

export const dynamic = 'force-dynamic'

/**
 * POST – Als Inhaber/Chef für einen Mitarbeiter einen Passwort-Reset-Link auslösen.
 * Body: { email: string }
 * Sendet die gleiche E-Mail wie „Passwort vergessen“, Redirect auf /login/set-password.
 */
export async function POST(req: NextRequest) {
  try {
    const { isStaffManager } = await getAdminContext()
    if (!isStaffManager) {
      return NextResponse.json({ error: 'Nur Inhaber oder Chef können einen Passwort-Reset für Mitarbeiter auslösen.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) {
      return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Service nicht verfügbar.' }, { status: 503 })
    }

    const admin = createSupabaseAdmin()

    // Prüfen: E-Mail muss ein aktiver Mitarbeiter sein (oder überhaupt in staff)
    const { data: staffRow } = await admin
      .from('staff')
      .select('id, email, is_active')
      .eq('email', email)
      .maybeSingle()

    if (!staffRow) {
      return NextResponse.json({ error: 'Diese E-Mail ist kein eingetragener Mitarbeiter.' }, { status: 404 })
    }

    if (!hasPasswordResetEmail()) {
      return NextResponse.json(
        { error: 'E-Mail-Versand nicht konfiguriert (RESEND_API_KEY). Passwort-Reset-E-Mails können derzeit nicht versendet werden.' },
        { status: 503 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin || 'http://localhost:3000'
    const redirectTo = `${baseUrl.replace(/\/$/, '')}/login/set-password`

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      // Nutzer könnte in Supabase Auth noch nicht existieren (z. B. Einladung nicht angenommen)
      return NextResponse.json(
        { error: 'Für diese E-Mail konnte kein Reset-Link erzeugt werden. Hat die Person sich schon einmal angemeldet bzw. das Passwort gesetzt?' },
        { status: 400 }
      )
    }

    const sendResult = await sendPasswordResetEmail(email, data.properties.action_link)
    if (!sendResult.ok) {
      console.error('[Staff send-password-reset] Send failed:', sendResult.error)
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `An ${email} wurde eine E-Mail mit dem Link zum Zurücksetzen des Passworts gesendet.`,
    })
  } catch (e) {
    console.error('[Staff send-password-reset] Error:', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
