import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessOrders } from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const ORDER_ROLES = ['owner', 'chef', 'admin', 'support', 'employee']

/**
 * GET – Liste der Mitarbeiter, die Bestellungen bearbeiten können (für Zuweisungs-Dropdown).
 * Jeder Admin mit Bestellzugriff darf diese Liste abrufen.
 */
export async function GET() {
  try {
    const { isAdmin, roles } = await getAdminContext()
    if (!isAdmin || !canAccessOrders(roles)) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }
    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
    }

    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .from('staff')
      .select('id, email, first_name, last_name, roles, is_active')

    if (error) {
      console.error('[assignable-staff]', error)
      return NextResponse.json([])
    }

    const list = (rows ?? []).filter((r: { roles?: string[]; is_active?: boolean }) => {
      if (r.is_active === false) return false
      const rolesArr = Array.isArray(r.roles) ? r.roles : []
      return rolesArr.some((role: string) => ORDER_ROLES.includes(role))
    }).map((r: { id: string; email: string; first_name?: string; last_name?: string }) => ({
      id: r.id,
      email: r.email,
      displayName: [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.email,
    }))

    return NextResponse.json(list)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    console.error('[assignable-staff]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
