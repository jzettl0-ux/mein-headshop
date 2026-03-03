import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/vine/add-product
 * Liste aller Produkte (zum Hinzufügen ins Vine-Programm).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: vineIds } = await admin.schema('cx').from('vine_products').select('product_id')
  const exclude = new Set((vineIds ?? []).map((r) => r.product_id))

  const { data, error } = await admin
    .from('products')
    .select('id, name, slug')
    .order('name')
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const products = (data ?? []).filter((p) => !exclude.has(p.id))
  return NextResponse.json(products)
}
