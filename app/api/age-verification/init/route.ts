import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { hasSupabaseAdmin, createSupabaseAdmin } from '@/lib/supabase-admin'
import { getAgeVerificationProvider } from '@/lib/age-verification-provider'
import { logAvsCompliance } from '@/lib/avs-compliance-log'
import { randomBytes } from 'crypto'

const TOKEN_EXPIRY_MINUTES = 15
const PROVIDER = (process.env.AGE_VERIFICATION_PROVIDER || 'simulation').toLowerCase()
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json().catch(() => ({}))
    const returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : '/checkout'
    const callbackUrl = `${BASE_URL.replace(/\/$/, '')}/api/age-verification/callback`

    if (user && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const { data: profile } = await admin
        .from('age_verification_profiles')
        .select('is_age_verified')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile?.is_age_verified) {
        const token = randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES)
        await admin.from('age_verification_tokens').insert({
          token,
          user_id: user.id,
          expires_at: expiresAt.toISOString(),
        })
        return NextResponse.json({ success: true, token, alreadyVerified: true })
      }
    }

    const provider = getAgeVerificationProvider()
    const result = await provider.init({
      userId: user?.id,
      email: user?.email,
      returnUrl,
      callbackUrl,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    if (PROVIDER === 'simulation' && result.sessionId) {
      if (!hasSupabaseAdmin()) {
        return NextResponse.json({ success: false, error: 'Admin-Client nicht verfügbar' }, { status: 500 })
      }
      const admin = createSupabaseAdmin()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + TOKEN_EXPIRY_MINUTES)

      await admin.from('age_verification_logs').insert({
        user_id: user?.id ?? null,
        provider: 'simulation',
        result: 'APPROVED',
      })

      await logAvsCompliance(admin, {
        customerId: user?.id ?? null,
        provider: 'simulation',
        result: 'APPROVED',
        sessionId: result.sessionId,
        sessionValidUntil: expiresAt,
      })

      if (user) {
        await admin.from('age_verification_profiles').upsert(
          { user_id: user.id, is_age_verified: true, verified_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
      }
      const token = randomBytes(32).toString('hex')
      await admin.from('age_verification_tokens').insert({
        token,
        user_id: user?.id ?? null,
        expires_at: expiresAt.toISOString(),
      })
      return NextResponse.json({
        success: true,
        token,
        redirectUrl: returnUrl,
      })
    }

    if (result.redirectUrl && result.sessionId && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      await admin.from('age_verification_pending').insert({
        session_id: result.sessionId,
        return_url: returnUrl,
        user_id: user?.id ?? null,
        provider: PROVIDER,
      })
    }

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      sessionId: result.sessionId,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Verifizierung konnte nicht gestartet werden.'
    console.error('[age-verification/init]', error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
