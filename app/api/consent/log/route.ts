import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/consent/log
 * Anonymisierter Eintrag in consent_logs (keine IP, keine User-ID).
 * Body: { ad_storage, analytics_storage, ad_user_data, ad_personalization } ('granted' | 'denied')
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const choices = {
      ad_storage: body.ad_storage === 'granted' ? 'granted' : 'denied',
      analytics_storage: body.analytics_storage === 'granted' ? 'granted' : 'denied',
      ad_user_data: body.ad_user_data === 'granted' ? 'granted' : 'denied',
      ad_personalization: body.ad_personalization === 'granted' ? 'granted' : 'denied',
    }
    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ ok: false }, { status: 503 })
    }
    const admin = createSupabaseAdmin()
    await admin.from('consent_logs').insert({ choices })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
