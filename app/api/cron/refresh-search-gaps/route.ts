/**
 * Cron: Search Gaps aktualisieren (Product Guidance)
 * GET /api/cron/refresh-search-gaps?secret=CRON_SECRET
 * Blueprint 3.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { refreshAllSearchGaps } from '@/lib/search-gaps-refresh'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await refreshAllSearchGaps()
    return NextResponse.json(result)
  } catch (e) {
    console.error('[cron/refresh-search-gaps]', e)
    return NextResponse.json(
      { error: (e as Error).message, refreshed: 0, errors: [] },
      { status: 500 }
    )
  }
}
