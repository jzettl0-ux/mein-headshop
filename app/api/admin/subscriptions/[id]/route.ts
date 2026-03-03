import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const VALID_STATUS = ['ACTIVE', 'PAUSED', 'CANCELLED'] as const

/**
 * PATCH /api/admin/subscriptions/[id]
 * Status eines Abos ändern (z. B. pausieren, kündigen).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { status } = body
  if (!status || !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: 'status muss ACTIVE, PAUSED oder CANCELLED sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('cx')
    .from('subscriptions')
    .update({ status })
    .eq('subscription_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Abo nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}
