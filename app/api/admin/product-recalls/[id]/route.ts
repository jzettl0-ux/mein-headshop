/**
 * Blueprint 3.3: Product Recall
 * PATCH – Rückruf aktivieren/deaktivieren
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  const body = await req.json().catch(() => ({}))
  const { is_active } = body

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active (boolean) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('compliance')
    .from('product_recalls')
    .update({ is_active })
    .eq('recall_id', id)
    .select()
    .single()

  if (error) {
    console.error('[admin/product-recalls] PATCH', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Rückruf nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}
