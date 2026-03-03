/**
 * Admin: OSS-Export für One-Stop-Shop Meldung (EU-VAT)
 * GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv|json
 * Listet B2C EU-Grenzüberschreitungen mit is_deemed_supplier (Deemed Seller).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getVatRateForCountry } from '@/lib/eu-vat'

export const dynamic = 'force-dynamic'

function toDate(s: string): Date {
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date() : d
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get('from') || ''
  const toStr = searchParams.get('to') || ''
  const format = searchParams.get('format') || 'json'

  const from = toDate(fromStr || new Date().getFullYear() + '-01-01')
  const to = toDate(toStr || new Date().toISOString().slice(0, 10))

  const admin = createSupabaseAdmin()

  const { data: ledgerRows, error } = await admin
    .schema('financials')
    .from('ledger')
    .select('transaction_id, order_id, transaction_type, amount, is_deemed_supplier, created_at')
    .in('transaction_type', ['SALE', 'SHIPPING_FEE'])
    .eq('is_deemed_supplier', true)
    .gte('created_at', from.toISOString())
    .lte('created_at', new Date(to.getTime() + 86400000).toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const orderIds = [...new Set((ledgerRows || []).map((r) => r.order_id).filter(Boolean))]
  let ordersMap: Record<string, { destination_country?: string; order_number?: string }> = {}
  if (orderIds.length > 0) {
    const { data: orders } = await admin.from('orders').select('id, order_number, destination_country, shipping_address').in('id', orderIds)
    for (const o of orders || []) {
      const addr = o.shipping_address as { country?: string } | null
      const dest = o.destination_country || (addr?.country === 'Deutschland' || addr?.country === 'DE' ? 'DE' : (addr?.country || 'DE').slice(0, 2).toUpperCase())
      ordersMap[o.id] = { destination_country: dest, order_number: o.order_number }
    }
  }

  const rows = (ledgerRows || []).map((r) => {
    const ord = ordersMap[r.order_id as string]
    const dest = ord?.destination_country || 'DE'
    const vatRate = getVatRateForCountry(dest)
    const netAmount = Math.round((Number(r.amount) / (1 + vatRate / 100)) * 100) / 100
    const vatAmount = Math.round((Number(r.amount) - netAmount) * 100) / 100
    return {
      transaction_id: r.transaction_id,
      order_id: r.order_id,
      order_number: ord?.order_number,
      transaction_type: r.transaction_type,
      gross_amount: Number(r.amount),
      net_amount: netAmount,
      vat_amount: vatAmount,
      vat_rate: vatRate,
      destination_country: dest,
      created_at: r.created_at,
    }
  })

  if (format === 'csv') {
    const header = 'order_number;transaction_type;destination_country;gross_amount;net_amount;vat_amount;vat_rate;created_at\n'
    const lines = rows.map((r) =>
      [r.order_number, r.transaction_type, r.destination_country, r.gross_amount.toFixed(2), r.net_amount.toFixed(2), r.vat_amount.toFixed(2), r.vat_rate, r.created_at].join(';')
    )
    return new NextResponse(header + lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="OSS-Export-${fromStr}-${toStr}.csv"`,
      },
    })
  }

  return NextResponse.json({
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    count: rows.length,
    rows,
  })
}
