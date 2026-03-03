import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Admin: alle Bewertungen inkl. moderation_status (für Feedback-Dashboard) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('product_reviews')
      .select('id, product_id, rating, comment, is_private, moderation_status, display_name, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const productIds = [...new Set((data ?? []).map((r) => r.product_id))]
    const { data: products } = await admin.from('products').select('id, name, slug').in('id', productIds)
    const productMap = new Map((products ?? []).map((p) => [p.id, p]))

    const list = (data ?? []).map((r) => ({
      ...r,
      product_name: productMap.get(r.product_id)?.name ?? '',
      product_slug: productMap.get(r.product_id)?.slug ?? '',
    }))

    return NextResponse.json(list)
  } catch (e) {
    console.error('admin reviews GET:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

/** PATCH – Moderation: Genehmigen oder Ablehnen. Body: { id, moderation_status: 'approved' | 'rejected' } */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const id = body.id ?? body.review_id
  const status = body.moderation_status
  if (!id || (status !== 'approved' && status !== 'rejected')) {
    return NextResponse.json({ error: 'id und moderation_status (approved/rejected) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('product_reviews')
    .update({ moderation_status: status })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Admin: Bewertung löschen */
export async function DELETE(req: Request) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('product_reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
