import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * POST – Bestellung mir zuweisen oder freigeben.
 * Body: { assigned_to_email: string | null }
 * Nutzt Service Role, damit Spalten (assigned_at) unabhängig vom Client-Schema-Cache sind.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const email = body.assigned_to_email === null || body.assigned_to_email === '' ? null : (typeof body.assigned_to_email === 'string' ? body.assigned_to_email.trim() : null)

  const admin = createSupabaseAdmin()
  const { data: prev } = await admin.from('orders').select('assigned_to_email').eq('id', id).single()
  const oldVal = (prev as { assigned_to_email?: string | null } | null)?.assigned_to_email ?? null

  const updates: Record<string, unknown> = {
    assigned_to_email: email,
    assigned_at: email ? new Date().toISOString() : null,
  }

  const { data, error } = await admin.from('orders').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { staff } = await getAdminContext()
  if (String(oldVal ?? '') !== String(email ?? '')) {
    await writeAuditLog(admin, {
      entity_type: 'order',
      entity_id: id,
      action: 'update',
      field_name: 'assigned_to_email',
      old_value: oldVal ?? '',
      new_value: email ?? '',
    }, { email: staff?.email, id: staff?.id })
  }
  return NextResponse.json(data)
}
