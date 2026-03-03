import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getRecentDomainEvents } from '@/lib/domain-events'

/**
 * GET – Letzte Domain-Events (Admin/Debug, Phase 12.1)
 * ?limit=50&event_type=order_created|payment_received
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const eventType = searchParams.get('event_type') as 'order_created' | 'payment_received' | null

  const events = await getRecentDomainEvents(
    limit,
    eventType && ['order_created', 'payment_received'].includes(eventType) ? eventType : undefined
  )

  return NextResponse.json(events)
}
