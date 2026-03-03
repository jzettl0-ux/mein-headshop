/**
 * PATCH – Admin: UGC-Post freigeben oder ablehnen
 * Body: { status: 'PUBLISHED' | 'REJECTED' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const status = body.status === 'PUBLISHED' || body.status === 'REJECTED' ? body.status : null
  if (!status) return NextResponse.json({ error: 'status (PUBLISHED oder REJECTED) erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('community')
    .from('ugc_posts')
    .update({ status })
    .eq('post_id', id)
    .select('post_id, status')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}
