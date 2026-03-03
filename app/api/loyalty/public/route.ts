import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getLoyaltySettings } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

/** GET – Öffentliche Loyalty-Infos (enabled, points_per_euro) für Produktseiten, Warenkorb etc. */
export async function GET() {
  if (!hasSupabaseAdmin()) return NextResponse.json({ enabled: false, points_per_euro: 1 })
  const admin = createSupabaseAdmin()
  const settings = await getLoyaltySettings(admin)
  return NextResponse.json({
    enabled: settings.enabled,
    points_per_euro: settings.points_per_euro,
  })
}
