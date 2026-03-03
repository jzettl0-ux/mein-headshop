import { NextRequest, NextResponse } from 'next/server'
import { hasSupabaseAdmin, createSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/age-verification/verify-token
 * Prüft ein Altersverifizierungs-Token (vom Checkout aufgerufen).
 * Token wird bei erfolgreicher Nutzung als "verwendet" markiert.
 */
export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ valid: false, error: 'Service nicht verfügbar' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const token = typeof body.token === 'string' ? body.token.trim() : ''

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token fehlt' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    const { data: row, error } = await admin
      .from('age_verification_tokens')
      .select('token, user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (error) {
      console.error('[age-verification/verify-token]', error)
      return NextResponse.json({ valid: false, error: 'Datenbankfehler' }, { status: 500 })
    }

    if (!row) {
      return NextResponse.json({ valid: false, error: 'Ungültiger oder unbekannter Token' })
    }

    if (row.used_at) {
      return NextResponse.json({ valid: false, error: 'Token wurde bereits verwendet' })
    }

    const now = new Date()
    const expiresAt = new Date(row.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ valid: false, error: 'Token abgelaufen' })
    }

    // Token als verwendet markieren (Einmalnutzung)
    await admin
      .from('age_verification_tokens')
      .update({ used_at: now.toISOString() })
      .eq('token', token)

    return NextResponse.json({ valid: true, userId: row.user_id })
  } catch (error: any) {
    console.error('[age-verification/verify-token]', error)
    return NextResponse.json(
      { valid: false, error: error?.message || 'Prüfung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
