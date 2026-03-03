/**
 * Cron: Repricer ausführen
 * GET /api/cron/run-repricer?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { runRepricer } from '@/lib/repricer'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runRepricer()
    return NextResponse.json(result)
  } catch (e) {
    console.error('[cron/run-repricer]', e)
    return NextResponse.json({ error: (e as Error).message, updated: 0 }, { status: 500 })
  }
}
