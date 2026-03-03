import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** POST – ASIN-Locks manuell aktualisieren (gleiche Logik wie Cron) */
export async function POST() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ ok: true, updated: 0, message: 'Backend nicht verfügbar' }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: raw } = await admin.from('product_reviews').select('product_id')
    const byProduct = new Map<string, number>()
    for (const r of (raw ?? []) as { product_id: string }[]) {
      if (r.product_id) byProduct.set(r.product_id, (byProduct.get(r.product_id) ?? 0) + 1)
    }
    const rows = [...byProduct.entries()].map(([product_id, count]) => ({ product_id, review_count: count, last_checked_at: new Date().toISOString() }))
    let updated = 0
    for (const row of rows) {
      const { error } = await admin
        .schema('enforcement')
        .from('asin_locks')
        .upsert(row, { onConflict: 'product_id' })
      if (!error) updated++
    }
    return NextResponse.json({ ok: true, updated, products: rows.length })
  } catch {
    return NextResponse.json({ ok: true, updated: 0, message: 'Fehler bei der Aktualisierung' }, { status: 200 })
  }
}
