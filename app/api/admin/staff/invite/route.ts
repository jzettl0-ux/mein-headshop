import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { hasStaffInviteEmail, sendStaffInviteWelcomeEmail } from '@/lib/send-staff-invite-email'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['employee', 'support', 'product_care', 'admin', 'hr', 'team_leader', 'warehouse_lead', 'marketing', 'chef', 'owner'] as const

function parseRoles(bodyRoles: unknown): string[] {
  if (Array.isArray(bodyRoles)) {
    const list = bodyRoles.filter((r) => typeof r === 'string' && ALLOWED_ROLES.includes(r as any))
    return list.length ? list : ['support']
  }
  if (typeof bodyRoles === 'string' && ALLOWED_ROLES.includes(bodyRoles as any)) return [bodyRoles]
  return ['support']
}

/**
 * POST – Mitarbeiter einladen (nur Owner/Chef).
 * Body: { email: string, roles: string[] } (roles = mehrere Rollen)
 */
export async function POST(req: NextRequest) {
  try {
    const { isStaffManager } = await getAdminContext()
    if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber, Chef oder Personal (HR) können einladen.' }, { status: 403 })
    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const roles = parseRoles(body.roles ?? body.role)

    if (!email) return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 })

    let admin
    try {
      admin = createSupabaseAdmin()
    } catch (e) {
      console.error('[Staff invite] createSupabaseAdmin:', e)
      return NextResponse.json({ error: 'Service nicht verfügbar.' }, { status: 503 })
    }

    const existingRes = await admin.from('staff').select('id, is_active, terminated_at').eq('email', email).maybeSingle()
    if (existingRes.error) {
      console.error('[Staff invite] Select existing error:', existingRes.error.message, existingRes.error.code)
      if (existingRes.error.code === '42P01' || existingRes.error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Mitarbeiter-Tabelle fehlt. Bitte zuerst migration-staff.sql im Supabase SQL Editor ausführen.' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: existingRes.error.message || 'Prüfung fehlgeschlagen.' }, { status: 500 })
    }
    const existing = existingRes.data as { id: string; is_active?: boolean; terminated_at?: string } | null
    if (existing) {
      if (existing.is_active) return NextResponse.json({ error: 'Diese E-Mail ist bereits als aktiver Mitarbeiter eingetragen.' }, { status: 400 })
      if (existing.terminated_at) {
        const date = existing.terminated_at ? new Date(existing.terminated_at).toLocaleDateString('de-DE') : ''
        return NextResponse.json(
          { error: `Diese Person wurde am ${date} gekündigt. Zum Wiedereinstellen in der Liste „Gekündigt“ die Person auswählen und „Wiedereinstellen“ nutzen.`, code: 'TERMINATED' }
        , { status: 400 })
      }
      return NextResponse.json({ error: 'Diese E-Mail ist bereits als Mitarbeiter eingetragen (inaktiv). Nutze „Wiedereinstellen“ in der Mitarbeiterliste.' }, { status: 400 })
    }

    const firstRole = roles[0] || 'support'

    // Zuerst mit roles (Array) versuchen – Tabelle nach migration-staff-multi-roles
    let result = await admin.from('staff').insert({
      email,
      roles,
      is_active: true,
    })
    let insertError = result.error

    // Fallback: Tabelle hat Spalte "role" (Einzelrolle), keine "roles"
    const needRoleFallback = insertError && (
      insertError.code === '42703' ||
      (typeof insertError.message === 'string' && (
        insertError.message.includes('roles') ||
        insertError.message.includes('does not exist') ||
        insertError.message.includes('column')
      ))
    )
    if (needRoleFallback) {
      result = await admin.from('staff').insert({
        email,
        role: firstRole,
        is_active: true,
      })
      insertError = result.error
      if (insertError && (insertError.code === '23514' || (insertError.message && /check|violates/.test(insertError.message)))) {
        const legacyRole = ['owner', 'admin', 'support'].includes(firstRole) ? firstRole : firstRole === 'chef' ? 'owner' : firstRole === 'product_care' ? 'admin' : 'support'
        result = await admin.from('staff').insert({
          email,
          role: legacyRole,
          is_active: true,
        })
        insertError = result.error
      }
    }

    if (insertError) {
      console.error('[Staff invite] Insert error:', insertError.message, insertError.code, insertError.details)
      const msg = insertError.message || 'Mitarbeiter konnte nicht angelegt werden.'
      return NextResponse.json(
        { error: process.env.NODE_ENV === 'development' ? msg : 'Mitarbeiter konnte nicht angelegt werden.' },
        { status: 500 }
      )
    }

    // Supabase Auth Einladung (sendet E-Mail mit Link zum Passwort setzen)
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/login/set-password` : undefined
    try {
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo || undefined,
      })
      if (inviteError) {
        console.log('[Staff invite] Auth invite:', inviteError.message)
      }
    } catch (e) {
      console.error('[Staff invite] Auth invite:', e)
    }

    // Willkommens-E-Mail im Shop-Design mit Kurzanleitung und Aufgaben je Rolle (wenn Resend konfiguriert)
    let welcomeEmailSent = false
    if (hasStaffInviteEmail()) {
      try {
        const result = await sendStaffInviteWelcomeEmail(email, { roles })
        welcomeEmailSent = result.ok
      } catch (e) {
        console.error('[Staff invite] Welcome email:', e)
      }
    }

    const message = welcomeEmailSent
      ? 'Mitarbeiter angelegt. Willkommens-Mail wurde versendet.'
      : hasStaffInviteEmail()
        ? 'Mitarbeiter angelegt. Willkommens-Mail konnte nicht gesendet werden (siehe Server-Log).'
        : 'Mitarbeiter angelegt. Für Willkommens-Mail RESEND_API_KEY in .env setzen. Supabase schickt ggf. den Passwort-Link (Auth-Einstellungen).'
    return NextResponse.json({ success: true, message, welcomeEmailSent })
  } catch (e) {
    console.error('[Staff invite] Error:', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
