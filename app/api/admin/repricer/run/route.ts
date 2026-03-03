/**
 * POST – Repricer manuell ausführen (aktualisiert Preise basierend auf Regeln)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { runRepricer } from '@/lib/repricer'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await runRepricer()
    return NextResponse.json(result)
  } catch (e) {
    console.error('[repricer/run]', e)
    return NextResponse.json(
      { error: (e as Error).message, updated: 0 },
      { status: 500 }
    )
  }
}
