/**
 * POST – Code scannen (Status: SCANNED_AT_FC oder DELIVERED)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { code, status } = body
  const codeVal = (code ?? '').toString().trim().toUpperCase()
  if (!codeVal || codeVal.length < 7 || codeVal.length > 20) {
    return NextResponse.json({ error: 'Ungültiger Code' }, { status: 400 })
  }

  const newStatus = status === 'DELIVERED' ? 'DELIVERED' : 'SCANNED_AT_FC'

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('security')
    .from('transparency_codes')
    .update({
      status: newStatus,
      scanned_at: new Date().toISOString(),
    })
    .eq('unique_qr_code', codeVal)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Code nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}
