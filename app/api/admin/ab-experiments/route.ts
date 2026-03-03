import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const EXPERIMENT_TYPES = ['MAIN_IMAGE', 'PRODUCT_TITLE', 'A_PLUS_CONTENT'] as const
const STATUSES = ['RUNNING', 'COMPLETED', 'CANCELLED'] as const

/** GET – A/B Experiments (Manage Your Experiments) laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ experiments: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: experiments, error } = await admin
      .schema('marketing')
      .from('ab_experiments')
      .select('experiment_id, product_id, vendor_id, experiment_type, variant_a_data, variant_b_data, status, start_date, end_date')
      .order('start_date', { ascending: false })

    if (error) return NextResponse.json({ experiments: [] }, { status: 200 })

    const productIds = [...new Set((experiments ?? []).map((e) => (e as { product_id: string }).product_id).filter(Boolean))]
    if (productIds.length === 0) return NextResponse.json({ experiments: experiments ?? [] })

    const { data: products } = await admin
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    const byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))

    const enriched = (experiments ?? []).map((e) => ({
      ...e,
      product_name: byId.get((e as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((e as { product_id: string }).product_id)?.slug ?? null,
    }))
    return NextResponse.json({ experiments: enriched })
  } catch {
    return NextResponse.json({ experiments: [] }, { status: 200 })
  }
}

/** POST – Neues A/B-Experiment anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const product_id = body.product_id
  const experiment_type = EXPERIMENT_TYPES.includes(body.experiment_type) ? body.experiment_type : 'MAIN_IMAGE'
  const variant_a_data = typeof body.variant_a_data === 'string' ? body.variant_a_data.trim() : ''
  const variant_b_data = typeof body.variant_b_data === 'string' ? body.variant_b_data.trim() : ''
  const vendor_id = body.vendor_id && typeof body.vendor_id === 'string' ? body.vendor_id.trim() || null : null

  if (!product_id || !variant_a_data || !variant_b_data) {
    return NextResponse.json({ error: 'product_id, variant_a_data und variant_b_data erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('marketing')
    .from('ab_experiments')
    .insert({
      product_id,
      vendor_id: vendor_id ?? null,
      experiment_type,
      variant_a_data,
      variant_b_data,
      status: 'RUNNING',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
