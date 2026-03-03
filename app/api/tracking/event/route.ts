import { NextRequest, NextResponse } from 'next/server'
import {
  isAllowedEvent,
  hasSufficientConsent,
  processClientEvent,
  type ConsentState,
} from '@/lib/tracking-server'

type Body = {
  event?: string
  params?: Record<string, unknown>
  consent?: ConsentState
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body
    const eventName = typeof body?.event === 'string' ? body.event.trim() : ''
    const params = body?.params && typeof body.params === 'object' ? body.params : {}
    const consent = body?.consent && typeof body.consent === 'object' ? body.consent : null

    if (!eventName) {
      return NextResponse.json({ error: 'event is required' }, { status: 400 })
    }

    if (!isAllowedEvent(eventName)) {
      return NextResponse.json({ error: 'event not allowed' }, { status: 400 })
    }

    const { forwarded } = await processClientEvent(eventName, params, consent)

    return NextResponse.json({ ok: true, forwarded })
  } catch (e) {
    console.error('POST /api/tracking/event error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
