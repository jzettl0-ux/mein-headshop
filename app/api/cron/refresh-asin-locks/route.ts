/**
 * GET /api/cron/refresh-asin-locks?secret=CRON_SECRET
 * Aktualisiert enforcement.asin_locks mit Review-Count (Anti-Review-Hijacking).
 * Vercel Cron: z. B. täglich um 3:30.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  const { data: raw } = await admin.from('product_reviews').select('product_id')
  const byProduct = new Map<string, number>()
  for (const r of (raw ?? []) as { product_id: string }[]) {
    if (r.product_id) byProduct.set(r.product_id, (byProduct.get(r.product_id) ?? 0) + 1)
  }
  const rows = [...byProduct.entries()].map(([product_id, count]) => ({ product_id, count }))
  let updated = 0
  for (const { product_id, count } of rows) {
    const { error } = await admin
      .schema('enforcement')
      .from('asin_locks')
      .upsert(
        { product_id, review_count: count, last_checked_at: new Date().toISOString() },
        { onConflict: 'product_id' }
      )
    if (!error) updated++
  }

  return NextResponse.json({
    ok: true,
    updated,
    products: rows.length,
    message: `ASIN-Locks: ${updated} Produkte aktualisiert.`,
  })
}
