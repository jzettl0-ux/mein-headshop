import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/b2b/tiered-prices?product_ids=id1,id2,...
 * Öffentlich: Staffelpreise für Produkte (für Warenkorb/Checkout).
 */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const ids = request.nextUrl.searchParams.get('product_ids')?.split(',').filter(Boolean) ?? []
  if (ids.length === 0) return NextResponse.json({})

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('b2b')
    .from('tiered_pricing')
    .select('product_id, min_quantity, unit_price')
    .in('product_id', ids)
    .order('min_quantity', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byProduct: Record<string, { min_quantity: number; unit_price: number }[]> = {}
  for (const row of data ?? []) {
    const pid = row.product_id
    if (!pid) continue
    if (!byProduct[pid]) byProduct[pid] = []
    byProduct[pid].push({
      min_quantity: Number(row.min_quantity),
      unit_price: Number(row.unit_price),
    })
  }
  return NextResponse.json(byProduct)
}
