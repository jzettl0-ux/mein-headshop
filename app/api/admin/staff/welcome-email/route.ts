import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, OWNER_EMAIL } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { hasStaffInviteEmail, sendStaffInviteWelcomeEmail } from '@/lib/send-staff-invite-email'
import { isResendSandbox } from '@/lib/resend-from'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['employee', 'support', 'product_care', 'admin', 'hr', 'team_leader', 'warehouse_lead', 'marketing', 'chef', 'owner'] as const

const SANDBOX_ERROR =
  'Mit der Resend-Testadresse können Willkommens-Mails nur an deine eigene E-Mail-Adresse gesendet werden. Um Mails an andere Mitarbeiter zu senden: Domain unter resend.com/domains verifizieren und RESEND_FROM_EMAIL setzen.'

/**
 * POST – Willkommens-E-Mail an einen Mitarbeiter senden.
 * Body: { id: string } (Staff-ID) oder { email: string }, optional { isReinvite?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const { isStaffManager } = await getAdminContext()
    if (!isStaffManager) {
      return NextResponse.json({ error: 'Nur Inhaber oder Chef können die Willkommens-Mail versenden.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const isReinvite = body.isReinvite === true

    if (!hasStaffInviteEmail()) {
      return NextResponse.json(
        { error: 'E-Mail-Versand nicht konfiguriert (RESEND_API_KEY in .env).' },
        { status: 503 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Service nicht verfügbar.' }, { status: 503 })
    }

    const admin = createSupabaseAdmin()

    let staffEmail: string
    let roles: string[] = []

    if (id) {
      const { data: row } = await admin
        .from('staff')
        .select('email, roles, role')
        .eq('id', id)
        .maybeSingle()
      if (!row) {
        return NextResponse.json({ error: 'Mitarbeiter nicht gefunden.' }, { status: 404 })
      }
      staffEmail = (row as any).email
      roles = Array.isArray((row as any).roles) ? (row as any).roles : (row as any).role ? [(row as any).role] : []
    } else if (email) {
      const { data: row } = await admin
        .from('staff')
        .select('email, roles, role')
        .eq('email', email)
        .maybeSingle()
      if (!row) {
        return NextResponse.json({ error: 'Mitarbeiter mit dieser E-Mail nicht gefunden.' }, { status: 404 })
      }
      staffEmail = row.email
      roles = Array.isArray((row as any).roles) ? (row as any).roles : (row as any).role ? [(row as any).role] : []
    } else {
      return NextResponse.json({ error: 'E-Mail oder ID des Mitarbeiters angeben.' }, { status: 400 })
    }

    // Resend-Sandbox: nur an eigene E-Mail senden
    if (isResendSandbox() && staffEmail.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: SANDBOX_ERROR }, { status: 503 })
    }

    const validRoles = roles.filter((r) => typeof r === 'string' && ALLOWED_ROLES.includes(r as any))

    const sendResult = await sendStaffInviteWelcomeEmail(staffEmail, {
      roles: validRoles.length ? validRoles : ['support'],
      isReinvite,
    })

    if (!sendResult.ok) {
      const msg =
        sendResult.error?.toLowerCase().includes('only send testing') ||
        sendResult.error?.toLowerCase().includes('verify a domain')
          ? SANDBOX_ERROR
          : sendResult.error || 'E-Mail konnte nicht gesendet werden.'
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      message: isReinvite
        ? `An ${staffEmail} wurde die Willkommens-Mail („Schön, dich wiederzusehen“) gesendet.`
        : `An ${staffEmail} wurde die Willkommens-Mail mit Kurzanleitung gesendet.`,
    })
  } catch (e) {
    console.error('[Staff welcome-email] Error:', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
