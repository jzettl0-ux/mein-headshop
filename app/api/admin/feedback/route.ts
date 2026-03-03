import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { addLoyaltyPoints, ensureLoyaltyAccount, getLoyaltySettings } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

/** GET – Alle Bewertungen inkl. moderation_status + Shop-Statistik (Durchschnitt über alle genehmigten) */
export async function GET() {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

    const admin = createSupabaseAdmin()

    let reviews: Array<{
      id: string
      product_id: string
      order_item_id?: string
      rating: number
      comment: string | null
      created_at: string
      is_private?: boolean | null
      moderation_status?: string | null
      display_name?: string | null
    }> | null = null
    let error: { message: string } | null = null

    const { data: reviewsAll, error: errAll } = await admin
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (errAll) {
      error = errAll
    } else {
      reviews = reviewsAll
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const productIds = [...new Set((reviews ?? []).map((r) => r.product_id).filter(Boolean))]
    let products: { id: string; name: string; slug: string }[] | null = null
    if (productIds.length > 0) {
      const { data: productsData } = await admin.from('products').select('id, name, slug').in('id', productIds)
      products = productsData
    }
    const productMap = new Map((products ?? []).map((p) => [p.id, p]))

    const list = (reviews ?? []).map((r) => ({
      id: r.id,
      product_id: r.product_id,
      order_item_id: r.order_item_id,
      rating: r.rating,
      comment: r.comment ?? null,
      created_at: r.created_at,
      is_private: r.is_private ?? false,
      moderation_status: r.moderation_status ?? 'pending',
      display_name: r.display_name ?? null,
      product_name: productMap.get(r.product_id)?.name ?? '',
      product_slug: productMap.get(r.product_id)?.slug ?? '',
    }))

    const approved = list.filter((r) => r.moderation_status === 'approved')
    const totalRating = approved.reduce((s, r) => s + (r.rating || 0), 0)
    const shopAverage = approved.length > 0 ? Math.round((totalRating / approved.length) * 100) / 100 : 0

    return NextResponse.json({
      reviews: list,
      shopAverage,
      totalCount: list.length,
      approvedCount: approved.length,
      pendingCount: list.filter((r) => r.moderation_status === 'pending').length,
    })
  } catch (e) {
    console.error('GET /api/admin/feedback:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Interner Fehler beim Laden der Bewertungen' },
      { status: 500 }
    )
  }
}

/** PATCH – Moderation: Genehmigen oder Ablehnen (moderation_status) */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  const status = body.moderation_status === 'approved' || body.moderation_status === 'rejected' ? body.moderation_status : null

  if (!id || !status) {
    return NextResponse.json({ error: 'id und moderation_status (approved/rejected) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('product_reviews')
    .update({ moderation_status: status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'approved') {
    try {
      const { data: review } = await admin.from('product_reviews').select('order_item_id').eq('id', id).single()
      const orderItemId = review?.order_item_id
      if (orderItemId) {
        const { data: oi } = await admin.from('order_items').select('order_id').eq('id', orderItemId).single()
        const orderId = oi?.order_id
        if (orderId) {
          const { data: order } = await admin.from('orders').select('user_id').eq('id', orderId).single()
          const userId = order?.user_id
          if (userId) {
            const settings = await getLoyaltySettings(admin)
            await ensureLoyaltyAccount(admin, userId)
            await addLoyaltyPoints(admin, userId, settings.points_per_review, 'review', 'review', id)
          }
        }
      }
    } catch (e) {
      console.error('feedback PATCH: loyalty points for review', e)
    }
  }

  return NextResponse.json({ ok: true, moderation_status: status })
}
