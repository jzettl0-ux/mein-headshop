import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste Payout Batches (Blueprint Phase 8: Deep Tech).
 * deep_tech.payout_batches mit Vendor-Info.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('deep_tech')
      .from('payout_batches')
      .select('batch_id, vendor_id, period_start, period_end, gross_sales, total_fees, net_payout, payout_status, bank_reference, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[payout-batches] list error:', error.message)
      return NextResponse.json({ batches: [] })
    }

    const vendorIds = [...new Set((rows ?? []).map((r) => r.vendor_id).filter(Boolean))]
    const vendorMap: Record<string, string> = {}
    if (vendorIds.length > 0) {
      const { data: vendors } = await admin.from('vendor_accounts').select('id, company_name').in('id', vendorIds)
      ;(vendors ?? []).forEach((v: { id: string; company_name?: string }) => {
        vendorMap[v.id] = v.company_name ?? v.id
      })
    }

    const batches = (rows ?? []).map((r) => ({
      ...r,
      vendor_name: vendorMap[r.vendor_id] ?? r.vendor_id,
    }))

    return NextResponse.json({ batches })
  } catch (e) {
    console.error('[payout-batches] error:', e)
    return NextResponse.json({ batches: [] })
  }
}
