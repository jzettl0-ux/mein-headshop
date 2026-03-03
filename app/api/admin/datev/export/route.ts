import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – DATEV-Schnittstelle: Export von Buchungsdaten für den Steuerberater.
 * CSV-Format für Import in DATEV oder Tools wie JTL2DATEV.
 * Query: ?year=2025 (Standard: aktuelles Jahr), ?format=datev (Standard) | simple
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const yearParam = req.nextUrl.searchParams.get('year')
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
  if (Number.isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 })
  }

  const start = new Date(year, 0, 1, 0, 0, 0)
  const end = new Date(year, 11, 31, 23, 59, 59)

  const admin = createSupabaseAdmin()
  const { data: orders } = await admin
    .from('orders')
    .select('id, order_number, customer_name, customer_email, shipping_address, total, subtotal, shipping_cost, discount_amount, payment_method, payment_status, created_at, updated_at')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true })

  const escapeCsv = (v: string | number): string => {
    const s = String(v ?? '')
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  // DATEV-typische Spalten: Belegdatum, Belegnummer, Kunde, Ort, Umsatz Brutto, MwSt, Netto, Zahlungsart, Status
  const header = 'Belegdatum;Belegnummer;Kunde;E-Mail;Ort;Umsatz_Brutto_EUR;MwSt_19_EUR;Netto_EUR;Versand_EUR;Rabatt_EUR;Zahlungsart;Zahlungsstatus'
  const rows: string[] = [header]

  const VAT_RATE = 0.19
  for (const o of orders || []) {
    const date = new Date(o.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const total = Number(o.total) ?? 0
    const netto = Math.round((total / (1 + VAT_RATE)) * 100) / 100
    const mwst = Math.round((total - netto) * 100) / 100
    const shipping = Number(o.shipping_cost) ?? 0
    const discount = Number(o.discount_amount) ?? 0
    const addr = (o.shipping_address as { city?: string } | null) ?? {}
    const ort = [addr.city, (addr as { postal_code?: string }).postal_code].filter(Boolean).join(' ') || '-'
    const paymentMethod = (o.payment_method ?? 'mollie').toString()
    const paymentStatus = (o.payment_status ?? 'pending').toString()

    rows.push([
      date,
      o.order_number,
      escapeCsv((o.customer_name ?? '').toString()),
      escapeCsv((o.customer_email ?? '').toString()),
      escapeCsv(ort),
      total.toFixed(2),
      mwst.toFixed(2),
      netto.toFixed(2),
      shipping.toFixed(2),
      discount.toFixed(2),
      paymentMethod,
      paymentStatus,
    ].join(';'))
  }

  const csv = '\uFEFF' + rows.join('\r\n')
  const filename = `DATEV-Export-${year}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
