import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Launchpad Accelerator Enrollments */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ enrollments: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: enrollments, error } = await admin
      .schema('vendor_programs')
      .from('launchpad_enrollments')
      .select('enrollment_id, vendor_id, product_id, program_start_date, program_end_date, exclusive_until, search_boost_multiplier, status, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ enrollments: [] }, { status: 200 })

    const productIds = [...new Set((enrollments ?? []).map((e) => (e as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, { name: string; slug: string | null }>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name, slug').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))
    }

    const enriched = (enrollments ?? []).map((e) => ({
      ...e,
      product_name: byId.get((e as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((e as { product_id: string }).product_id)?.slug ?? null,
    }))

    return NextResponse.json({ enrollments: enriched })
  } catch {
    return NextResponse.json({ enrollments: [] }, { status: 200 })
  }
}
