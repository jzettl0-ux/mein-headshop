import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/vine/invitation/decline
 * Tester lehnt Einladung ab.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const token = body.token?.trim()
  if (!token) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('cx')
    .from('vine_invitations')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('token', token)
    .eq('status', 'invited')
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Einladung nicht gefunden oder bereits bearbeitet' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
