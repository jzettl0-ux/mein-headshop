import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const VALID_STATUS = ['UNDER_REVIEW', 'WAITING_ON_SELLER', 'GRANTED', 'DENIED', 'WITHDRAWN'] as const

/**
 * PATCH /api/admin/a-to-z-claims/[id]
 * Admin aktualisiert Status eines A-bis-z-Anspruchs.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { status, admin_notes, resolution_reason } = body

  if (!status || !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const updates: Record<string, unknown> = { status }
  if (typeof admin_notes === 'string') updates.admin_notes = admin_notes.trim() || null
  if (typeof resolution_reason === 'string') updates.resolution_reason = resolution_reason.trim() || null
  if (['GRANTED', 'DENIED', 'WITHDRAWN'].includes(status)) {
    updates.resolved_at = new Date().toISOString()
  }

  const { data, error } = await admin
    .schema('cx')
    .from('a_to_z_claims')
    .update(updates)
    .eq('claim_id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Anspruch nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json(data)
}
