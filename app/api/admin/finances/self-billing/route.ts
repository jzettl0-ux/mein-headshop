/**
 * Admin: Self-Billing Gutschriften (§14 UStG) auflisten
 * GET – alle SELF_BILLING_CREDIT_NOTE Einträge
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const vendorId = searchParams.get('vendor_id')?.trim() || undefined

  const admin = createSupabaseAdmin()
  let query = admin
    .schema('financials')
    .from('invoices')
    .select('invoice_id, invoice_number, order_id, vendor_id, net_amount, tax_rate, gross_amount, issued_date, created_at, e_invoice_xml_url')
    .eq('document_type', 'SELF_BILLING_CREDIT_NOTE')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (vendorId) {
    query = query.eq('vendor_id', vendorId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
