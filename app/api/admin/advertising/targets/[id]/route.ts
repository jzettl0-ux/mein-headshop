import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { checkKcanAdvertising } from '@/lib/kcan-advertising-check'

/** PATCH – Target aktualisieren */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (['KEYWORD', 'ASIN', 'PRODUCT'].includes(body.target_type)) updates.target_type = body.target_type
  if (typeof body.target_value === 'string' && body.target_value.trim()) {
    const kcan = checkKcanAdvertising(body.target_value.trim())
    if (kcan.blocked) {
      return NextResponse.json({
        error: `KCanG §6: Target enthält verherrlichenden Begriff "${kcan.matchedTerm}". Bitte neutral formulieren.`,
      }, { status: 400 })
    }
    updates.target_value = body.target_value.trim()
  }
  if (typeof body.max_bid_amount === 'number' && body.max_bid_amount >= 0) {
    updates.max_bid_amount = Math.round(body.max_bid_amount * 100) / 100
  }
  if (['EXACT', 'PHRASE', 'BROAD', 'AUTO'].includes(body.match_type)) updates.match_type = body.match_type
  if (body.product_id !== undefined) updates.product_id = body.product_id || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advertising')
    .from('targets')
    .update(updates)
    .eq('target_id', id)
    .select('*, products(id, name, slug, image_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Target löschen */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('advertising').from('targets').delete().eq('target_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
