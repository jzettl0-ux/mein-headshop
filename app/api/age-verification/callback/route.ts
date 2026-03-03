/**
 * Phase 4.1: Callback nach Identitätsprüfung beim Provider
 * Provider leitet hierher weiter mit session_id (oder transactionId, identificationId).
 * Wir prüfen den Status, erstellen Token und leiten zur Done-Seite weiter.
 */

import { NextRequest, NextResponse } from 'next/server'
import { hasSupabaseAdmin, createSupabaseAdmin } from '@/lib/supabase-admin'
import { getAgeVerificationProvider } from '@/lib/age-verification-provider'
import { logAvsCompliance } from '@/lib/avs-compliance-log'
import { randomBytes } from 'crypto'

const TOKEN_EXPIRY_MINUTES = 15
const PROVIDER = (process.env.AGE_VERIFICATION_PROVIDER || 'simulation').toLowerCase()
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/** Provider-spezifische Query-Parameter für Session/Transaction-ID */
const SESSION_PARAM_NAMES = ['session_id', 'sessionId', 'transactionId', 'identificationId', 'transaction_id']

function getSessionIdFromQuery(searchParams: URLSearchParams): string | null {
  for (const name of SESSION_PARAM_NAMES) {
    const val = searchParams.get(name)
    if (val?.trim()) return val.trim()
  }
  return null
}

export async function GET(req: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.redirect(`${BASE_URL}/checkout?av_error=Service nicht verfügbar`)
  }

  const { searchParams } = new URL(req.url)
  const providerSessionId = getSessionIdFromQuery(searchParams)
  const returnUrl = searchParams.get('return_url') || '/checkout'
  const decodedReturnUrl = decodeURIComponent(returnUrl).replace(/^\/+/, '/') || '/checkout'

  if (!providerSessionId) {
    console.warn('[age-verification/callback] Keine session_id erhalten')
    return NextResponse.redirect(`${BASE_URL}/checkout?av_error=Keine Sitzung`)
  }

  const admin = createSupabaseAdmin()
  const { data: pending } = await admin
    .from('age_verification_pending')
    .select('return_url, user_id, provider')
    .eq('session_id', providerSessionId)
    .maybeSingle()

  const effectiveReturnUrl = pending?.return_url || decodedReturnUrl
  const userId = pending?.user_id ?? null

  await admin.from('age_verification_pending').delete().eq('session_id', providerSessionId)

  const provider = getAgeVerificationProvider()
  const statusResult = await provider.checkStatus(providerSessionId)

  if (statusResult.status !== 'approved') {
    await admin.from('age_verification_logs').insert({
      user_id: userId,
      provider: PROVIDER,
      result: 'REJECTED',
    })
    await logAvsCompliance(admin, {
      customerId: userId,
      provider: PROVIDER,
      result: 'REJECTED',
      sessionId: providerSessionId,
      sessionValidUntil: new Date(),
    })
    const errMsg = statusResult.error || 'Altersprüfung nicht bestanden'
    return NextResponse.redirect(`${BASE_URL}/checkout/age-verification?returnTo=${encodeURIComponent(effectiveReturnUrl)}&error=${encodeURIComponent(errMsg)}`)
  }

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES)
  const token = randomBytes(32).toString('hex')

  await admin.from('age_verification_logs').insert({
    user_id: userId,
    provider: PROVIDER,
    result: 'APPROVED',
  })

  await logAvsCompliance(admin, {
    customerId: userId,
    provider: PROVIDER,
    result: 'APPROVED',
    sessionId: providerSessionId,
    sessionValidUntil: expiresAt,
  })

  if (userId) {
    await admin.from('age_verification_profiles').upsert(
      { user_id: userId, is_age_verified: true, verified_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  }

  await admin.from('age_verification_tokens').insert({
    token,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  })

  const doneUrl = `${BASE_URL}/checkout/age-verification/done?token=${token}&returnTo=${encodeURIComponent(effectiveReturnUrl)}`
  return NextResponse.redirect(doneUrl)
}
