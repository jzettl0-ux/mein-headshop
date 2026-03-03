import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { OWNER_EMAIL } from '@/lib/owner-email'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste aller Mitarbeiter (nur Owner/Chef = Staff-Manager).
 * is_owner_account = true für das Inhaber-Konto (Chef darf daran nichts ändern).
 */
export async function GET() {
  try {
    const { isStaffManager } = await getAdminContext()
    if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber, Chef oder Personal (HR) können Mitarbeiter verwalten.' }, { status: 403 })
    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

    const admin = createSupabaseAdmin()
    const { data, error } = await admin.from('staff').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('[staff GET] Supabase error:', error)
      const hint = error.code === '42P01' ? ' Tabelle staff anlegen (z. B. migration-staff.sql + migration-staff-multi-roles.sql).'
        : error.message?.includes('role') && !error.message?.includes('roles') ? ' Spalte role wurde durch roles ersetzt – migration-staff-roles-extended.sql ausführen.'
        : ''
      return NextResponse.json({ error: error.message + hint }, { status: 500 })
    }
    const list = (data ?? []).map((row: { email?: string } & Record<string, unknown>) => ({
      ...row,
      is_owner_account: row.email?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
    }))
    return NextResponse.json(list)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
    console.error('[staff GET]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
