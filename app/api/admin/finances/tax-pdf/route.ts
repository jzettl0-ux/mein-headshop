import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const dynamic = 'force-dynamic'

const MARGIN = 50
const LINE_HEIGHT = 14
const FONT_SIZE = 10
const FONT_SIZE_SMALL = 8

/** Mollie-Gebühr: 0,29 € + 0,25 % */
function estimateMollieFee(totalEur: number): number {
  return 0.29 + totalEur * 0.0025
}

/**
 * GET – Monatsübersicht für die Steuer als PDF. Query: ?month=YYYY-MM (Standard: aktueller Monat).
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const monthParam = req.nextUrl.searchParams.get('month') || ''
  const match = monthParam.match(/^(\d{4})-(\d{2})$/)
  const now = new Date()
  const year = match ? parseInt(match[1], 10) : now.getFullYear()
  const month = match ? parseInt(match[2], 10) - 1 : now.getMonth()
  const start = new Date(year, month, 1, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const admin = createSupabaseAdmin()
  const { data: orders } = await admin
    .from('orders')
    .select('id, order_number, total, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true })

  const orderIds = (orders || []).map((o) => o.id)
  let items: { order_id: string; product_id: string; quantity: number; price: number }[] = []
  if (orderIds.length > 0) {
    const { data: itemsData } = await admin
      .from('order_items')
      .select('order_id, product_id, quantity, price')
      .in('order_id', orderIds)
    items = (itemsData || []).map((i) => ({
      order_id: i.order_id,
      product_id: i.product_id ?? '',
      quantity: Number(i.quantity) || 0,
      price: Number(i.price) || 0,
    }))
  }

  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))]
  let costByProductId: Record<string, number> = {}
  if (productIds.length > 0) {
    const { data: prods } = await admin.from('products').select('id, cost_price').in('id', productIds)
    for (const p of prods || []) {
      costByProductId[p.id] = Number(p.cost_price) ?? 0
    }
  }

  let income = 0
  let cogs = 0
  let mollieFees = 0
  for (const o of orders || []) {
    income += Number(o.total) ?? 0
    mollieFees += estimateMollieFee(Number(o.total) ?? 0)
  }
  for (const it of items) {
    const cost = costByProductId[it.product_id] ?? 0
    cogs += cost * it.quantity
  }
  const profit = income - cogs - mollieFees
  const reserve30 = profit * 0.3

  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { width, height } = page.getSize()
  let y = height - MARGIN

  const write = (text: string, opts?: { bold?: boolean; small?: boolean }) => {
    const f = opts?.bold ? fontBold : font
    const size = opts?.small ? FONT_SIZE_SMALL : FONT_SIZE
    page.drawText(text, { x: MARGIN, y, size, font: f, color: rgb(0.1, 0.1, 0.1) })
    y -= LINE_HEIGHT * (opts?.small ? 0.9 : 1)
  }
  const writeRight = (text: string) => {
    const tw = font.widthOfTextAtSize(text, FONT_SIZE)
    page.drawText(text, { x: width - MARGIN - tw, y, size: FONT_SIZE, font, color: rgb(0.1, 0.1, 0.1) })
    y -= LINE_HEIGHT
  }

  const monthLabel = start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  write('Monatsübersicht für die Steuer', { bold: true })
  write(monthLabel, { bold: true })
  y -= LINE_HEIGHT

  write('Buchungen (bezahlte Bestellungen):')
  for (const o of orders || []) {
    const date = new Date(o.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    write(`${date}  #${o.order_number}  ${Number(o.total).toFixed(2)} €`, { small: true })
  }
  if (!orders?.length) write('Keine Buchungen in diesem Monat.', { small: true })
  y -= LINE_HEIGHT * 1.5

  write('Zusammenfassung:', { bold: true })
  write(`Einnahmen (Umsatz):        ${income.toFixed(2)} €`)
  write(`Wareneinsatz (Einkauf):   - ${cogs.toFixed(2)} €`)
  write(`Zahlungsgebühren (Mollie): - ${mollieFees.toFixed(2)} €`)
  write(`Gewinn:                   ${profit.toFixed(2)} €`)
  write(`30 % Rücklage (Steuer):   ${reserve30.toFixed(2)} €`, { bold: true })
  y -= LINE_HEIGHT
  write('Erstellt am ' + new Date().toLocaleDateString('de-DE') + ' – Premium Headshop Admin', { small: true })

  const pdfBytes = await doc.save()
  const filename = `Steuer-Monatsuebersicht-${year}-${String(month + 1).padStart(2, '0')}.pdf`
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
