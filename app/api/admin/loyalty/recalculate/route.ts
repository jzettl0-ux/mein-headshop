import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { recalculateAllTiers } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

/** POST – Alle Kundentiers manuell neu berechnen (z. B. nach Schwellen-Änderung) */
export async function POST() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const updated = await recalculateAllTiers(admin)
  return NextResponse.json({ ok: true, updated })
}
