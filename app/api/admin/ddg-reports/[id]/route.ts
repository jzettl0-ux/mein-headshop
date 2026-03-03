/**
 * Phase 5.2: DDG Notice & Action – Admin Bearbeitung
 * PATCH – Status und action_taken aktualisieren (nur Inhaber)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const status = typeof body.status === 'string' && ['PENDING', 'INVESTIGATING', 'REMOVED', 'DISMISSED'].includes(body.status)
    ? body.status
    : undefined
  const actionTaken = typeof body.action_taken === 'string' ? body.action_taken.trim().slice(0, 255) : undefined

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (actionTaken !== undefined) updates.action_taken = actionTaken
  if (status && ['REMOVED', 'DISMISSED'].includes(status)) {
    updates.resolved_at = new Date().toISOString()
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('compliance')
    .from('ddg_content_reports')
    .update(updates)
    .eq('report_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
