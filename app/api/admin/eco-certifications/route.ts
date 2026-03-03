/**
 * Blueprint 2.5: Eco-Zertifizierungen
 * GET – Liste aller Zertifikate (gefiltert nach status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  VERIFIED: 'Verifiziert',
  REJECTED: 'Abgelehnt',
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const admin = createSupabaseAdmin()
  let query = admin
    .schema('catalog')
    .from('eco_certifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/eco-certifications]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    status_label: STATUS_LABELS[String(r.status)] ?? r.status,
  }))
  return NextResponse.json({ certifications: list })
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { vendor_id, product_id, asin, certification_type, document_url } = body

  const vendorId = typeof vendor_id === 'string' ? vendor_id.trim() : ''
  const certType = typeof certification_type === 'string' ? certification_type.trim() : ''
  const docUrl = typeof document_url === 'string' ? document_url.trim() : ''

  if (!vendorId || !certType || !docUrl) {
    return NextResponse.json({ error: 'vendor_id, certification_type und document_url erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog')
    .from('eco_certifications')
    .insert({
      vendor_id: vendorId,
      product_id: product_id?.trim() || null,
      asin: asin?.trim() || null,
      certification_type: certType,
      document_url: docUrl,
      status: 'PENDING',
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/eco-certifications] POST', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
