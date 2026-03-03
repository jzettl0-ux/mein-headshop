/**
 * Cron: Inventory Health berechnen
 * GET /api/cron/calculate-inventory-health?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateInventoryHealth } from '@/lib/inventory-health'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await calculateInventoryHealth()
    return NextResponse.json(result)
  } catch (e) {
    console.error('[cron/calculate-inventory-health]', e)
    return NextResponse.json(
      { error: (e as Error).message, processed: 0 },
      { status: 500 }
    )
  }
}
