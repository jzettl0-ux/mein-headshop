/**
 * Blueprint 3.1: Transparency – Kunden-Verifizierung
 * GET ?code=ABC123… – Öffentlich: Prüft ob Code gültig und zeigt Authentizität
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code || code.length < 7 || code.length > 20) {
    return NextResponse.json({ valid: false, message: 'Ungültiger Code' }, { status: 400 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ valid: false, message: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('security')
    .from('transparency_codes')
    .select('code_id, unique_qr_code, status, product_id, asin, created_at')
    .eq('unique_qr_code', code)
    .maybeSingle()

  if (error) {
    console.error('[transparency/verify]', error)
    return NextResponse.json({ valid: false, message: 'Fehler bei der Prüfung' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ valid: false, message: 'Code nicht gefunden – möglicherweise Fälschung' })
  }

  const status = (data as { status?: string }).status
  const isDelivered = status === 'DELIVERED'
  return NextResponse.json({
    valid: true,
    authenticated: true,
    status,
    message: isDelivered
      ? 'Produkt ist ein Original und wurde an einen Kunden ausgeliefert.'
      : 'Produkt ist ein Original. Code wurde noch nicht für den Versand gescannt.',
    created_at: (data as { created_at?: string }).created_at,
  })
}
