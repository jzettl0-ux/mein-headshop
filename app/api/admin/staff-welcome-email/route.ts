import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { hasStaffInviteEmail, sendStaffInviteWelcomeEmail } from '@/lib/send-staff-invite-email'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['employee', 'support', 'product_care', 'admin', 'chef', 'owner'] as const

/** GET – nur zum Prüfen, ob die Route erreichbar ist (Frontend nutzt POST). */
export async function GET() {
  return Response.json({
    route: 'staff-welcome-email',
    method: 'POST',
    body: { email: 'mitarbeiter@beispiel.de', isReinvite: false },
  })
}

/**
 * POST – Willkommens-E-Mail (erneut) an einen Mitarbeiter senden.
 * Body: { email: string } oder { id: string }, optional { isReinvite?: boolean }
 * Nutzung: z. B. nach Wiedereinstieg („Schön, dich wiederzusehen“) oder um die Anleitung erneut zu schicken.
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

    if (email) {
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
    } else if (id) {
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
    } else {
      return NextResponse.json({ error: 'E-Mail oder ID des Mitarbeiters angeben.' }, { status: 400 })
    }

    const validRoles = roles.filter((r) => typeof r === 'string' && ALLOWED_ROLES.includes(r as any))

    const sendResult = await sendStaffInviteWelcomeEmail(staffEmail, {
      roles: validRoles.length ? validRoles : ['support'],
      isReinvite,
    })

    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error || 'E-Mail konnte nicht gesendet werden.' },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message: isReinvite
        ? `An ${staffEmail} wurde die Willkommens-Mail („Schön, dich wiederzusehen“) gesendet.`
        : `An ${staffEmail} wurde die Willkommens-Mail mit Kurzanleitung gesendet.`,
    })
  } catch (e) {
    console.error('[Staff send-welcome-email] Error:', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
