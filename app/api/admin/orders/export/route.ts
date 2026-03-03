import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

function escapeCsv(value: string): string {
  const s = String(value ?? '').replace(/"/g, '""')
  return s.includes(',') || s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
}

/** Brutto → Netto (19 % MwSt.) */
function netFromGross(gross: number): number {
  return Math.round((gross / 1.19) * 100) / 100
}
/** Brutto → MwSt.-Betrag (19 %) */
function vatFromGross(gross: number): number {
  return Math.round((gross - gross / 1.19) * 100) / 100
}

/**
 * GET /api/admin/orders/export?year=2024
 * Liefert alle Bestellungen (optional nach Jahr) als CSV für Google Sheets – steuerrelevant (Netto, MwSt., Stornierungen).
 * Nur Admin.
 */
export async function GET(request: NextRequest) {
  const { isOwner } = await getAdminContext()
  if (!isOwner) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const admin = hasSupabaseAdmin() ? createSupabaseAdmin() : await createServerSupabase()

  let query = admin
    .from('orders')
    .select('id, order_number, created_at, customer_name, customer_email, shipping_address, billing_address, subtotal, shipping_cost, discount_amount, discount_code, total, status, payment_status, has_adult_items')
    .order('created_at', { ascending: true })

  if (yearParam) {
    const year = parseInt(yearParam, 10)
    if (!Number.isNaN(year) && year >= 2000 && year <= 2100) {
      const start = `${year}-01-01T00:00:00.000Z`
      const end = `${year + 1}-01-01T00:00:00.000Z`
      query = query.gte('created_at', start).lt('created_at', end)
    }
  }

  const { data: orders, error: ordersError } = await query

  if (ordersError) {
    console.error('Orders export error', ordersError)
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  const headerRow =
    'Rechnungsnummer;Leistungsdatum;Art;Stornierung;Kunde;E-Mail;Rechnungsadresse;Zwischensumme Brutto (€);Versand Brutto (€);Rabatt (€);Summe Netto (€);MwSt. 19% (€);Summe Brutto (€);Betrag für USt (€);Status Bestellung;Zahlungsstatus;Artikel'

  if (!orders || orders.length === 0) {
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="bestellungen-steuer${yearParam ? `-${yearParam}` : ''}.csv"`)
    return new NextResponse(headerRow + '\n', { headers })
  }

  const orderIds = orders.map((o) => o.id)
  const { data: items } = await admin
    .from('order_items')
    .select('order_id, product_name, quantity')
    .in('order_id', orderIds)

  const itemsByOrder = new Map<string, { product_name: string; quantity: number }[]>()
  if (items) {
    for (const row of items) {
      const list = itemsByOrder.get(row.order_id) || []
      list.push({ product_name: row.product_name, quantity: row.quantity })
      itemsByOrder.set(row.order_id, list)
    }
  }

  const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    processing: 'In Bearbeitung',
    shipped: 'Versandt',
    delivered: 'Zugestellt',
    cancelled: 'Storniert',
    cancellation_requested: 'Stornierung beantragt',
    cancellation_rejected: 'Stornierung abgelehnt',
    return_requested: 'Rücksendung beantragt',
    return_rejected: 'Rücksendung abgelehnt',
    return_completed: 'Rücksendung abgeschlossen',
  }
  const paymentLabels: Record<string, string> = {
    paid: 'Bezahlt',
    pending: 'Offen',
    failed: 'Fehlgeschlagen',
    refunded: 'Erstattet',
  }

  const rows: string[] = [
    headerRow,
    ...orders.map((o) => {
      const orderItems = itemsByOrder.get(o.id) || []
      const artikel = orderItems.map((i) => `${i.product_name} ×${i.quantity}`).join(', ')
      const leistungsdatum = new Date(o.created_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const billing = (o.billing_address || o.shipping_address) as { street?: string; house_number?: string; postal_code?: string; city?: string; country?: string } | undefined
      const adresse = billing
        ? [billing.street, billing.house_number].filter(Boolean).join(' ') + ', ' + [billing.postal_code, billing.city].filter(Boolean).join(' ') + (billing.country ? ', ' + billing.country : '')
        : ''

      const status = o.status ?? 'pending'
      const paymentStatus = o.payment_status ?? 'pending'
      const isStorno = status === 'cancelled' || paymentStatus === 'refunded'
      const art = isStorno ? 'Storno' : 'Verkauf'
      const stornierung = status === 'cancelled' ? 'Storniert' : paymentStatus === 'refunded' ? 'Erstattet' : '–'

      const totalBrutto = Number(o.total) ?? 0
      const subtotalBrutto = Number(o.subtotal) ?? 0
      const shippingBrutto = Number(o.shipping_cost) ?? 0
      const discount = Number(o.discount_amount) ?? 0
      const summeNetto = netFromGross(totalBrutto)
      const mwst = vatFromGross(totalBrutto)
      const betragUst = isStorno ? -totalBrutto : totalBrutto

      return [
        escapeCsv(o.order_number),
        escapeCsv(leistungsdatum),
        escapeCsv(art),
        escapeCsv(stornierung),
        escapeCsv(o.customer_name ?? ''),
        escapeCsv(o.customer_email ?? ''),
        escapeCsv(adresse),
        subtotalBrutto.toFixed(2),
        shippingBrutto.toFixed(2),
        discount.toFixed(2),
        summeNetto.toFixed(2),
        mwst.toFixed(2),
        totalBrutto.toFixed(2),
        betragUst.toFixed(2),
        escapeCsv(statusLabels[status] ?? status),
        escapeCsv(paymentLabels[paymentStatus] ?? paymentStatus),
        escapeCsv(artikel),
      ].join(';')
    }),
  ]

  const csv = rows.join('\n')
  const bom = '\uFEFF'
  const headers = new Headers()
  headers.set('Content-Type', 'text/csv; charset=utf-8')
  headers.set('Content-Disposition', `attachment; filename="bestellungen-steuer${yearParam ? `-${yearParam}` : ''}.csv"`)

  return new NextResponse(bom + csv, { headers })
}
