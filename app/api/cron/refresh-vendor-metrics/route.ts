import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/cron/refresh-vendor-metrics?secret=CRON_SECRET
 * Aggregiert ODR, LSR, VTR aus order_lines/orders und aktualisiert vendor_performance_metrics.
 * Ruft außerdem refresh_buybox_winners() auf.
 * Vercel Cron: z. B. täglich um 4:00.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

  const { error } = await admin.rpc('refresh_vendor_performance_metrics')

  if (error) {
    console.error('refresh-vendor-metrics:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: 'Vendor-Metriken und Buy-Box aktualisiert.',
  })
}
