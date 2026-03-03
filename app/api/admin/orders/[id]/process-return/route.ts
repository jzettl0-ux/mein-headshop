import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { generateCreditNotePdf } from '@/lib/credit-note-pdf'
import { createMollieRefund } from '@/lib/mollie'

export const dynamic = 'force-dynamic'

/**
 * POST – Retoure abwickeln: Gutschrift-PDF erzeugen, Betrag in refunds eintragen, optional Lagerbestand erhöhen.
 * Body: { amount_eur: number, restore_stock?: boolean }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const orderId = resolved?.id
  if (!orderId) return NextResponse.json({ error: 'Order-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const amount_eur = typeof body.amount_eur === 'number' && body.amount_eur > 0 ? body.amount_eur : null
  if (amount_eur == null) return NextResponse.json({ error: 'amount_eur (positiver Betrag) erforderlich' }, { status: 400 })
  const restore_stock = Boolean(body.restore_stock)

  const admin = createSupabaseAdmin()
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, order_number, mollie_payment_id, payment_status, created_at, customer_name, customer_email, billing_address, total')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })

  // Mollie-Erstattung zuerst auslösen (vor DB-Writes, damit bei Fehler kein inkonsistenter Zustand)
  const molliePaymentId = (order as { mollie_payment_id?: string | null }).mollie_payment_id
  if (molliePaymentId?.trim() && process.env.MOLLIE_API_KEY?.trim()) {
    try {
      await createMollieRefund({
        paymentId: molliePaymentId.trim(),
        amountEur: amount_eur,
        description: `Erstattung Bestellung #${order.order_number} – Gutschrift`,
      })
    } catch (mollieErr: unknown) {
      console.error('process-return Mollie refund error:', mollieErr)
      return NextResponse.json(
        { error: `Mollie-Erstattung fehlgeschlagen: ${mollieErr instanceof Error ? mollieErr.message : 'Unbekannter Fehler'}` },
        { status: 500 }
      )
    }
  }

  const { data: items } = await admin.from('order_items').select('id, product_id, product_name, quantity, returned_quantity, price, total').eq('order_id', orderId)
  const billing = (order.billing_address as Record<string, unknown>) || {}
  const creditNoteNumber = `GS-${order.order_number}-${Date.now().toString(36).toUpperCase()}`

  const pdfBytes = await generateCreditNotePdf({
    order_number: order.order_number,
    credit_note_number: creditNoteNumber,
    created_at: order.created_at,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    billing_address: {
      first_name: billing.first_name as string,
      last_name: billing.last_name as string,
      street: billing.street as string,
      house_number: billing.house_number as string,
      postal_code: billing.postal_code as string,
      city: billing.city as string,
      country: billing.country as string,
    },
    amount_eur,
    reason: 'Rücksendung',
  })

  const fileName = `gutschrift-${order.order_number}-${Date.now()}.pdf`
  const { error: uploadErr } = await admin.storage
    .from('invoices')
    .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadErr) {
    console.error('process-return upload:', uploadErr)
    return NextResponse.json({ error: 'Gutschrift-PDF konnte nicht gespeichert werden' }, { status: 500 })
  }

  const { error: insertErr } = await admin.from('refunds').insert({
    order_id: orderId,
    amount_eur,
    credit_note_filename: fileName,
  })

  if (insertErr) {
    console.error('process-return refund insert:', insertErr)
    return NextResponse.json({ error: 'Gutschrift konnte nicht gebucht werden' }, { status: 500 })
  }

  const orderTotal = Number((order as { total?: number }).total ?? 0)
  const paymentStatus = (order as { payment_status?: string }).payment_status
  if (amount_eur >= orderTotal && paymentStatus === 'paid') {
    await admin.from('orders').update({ payment_status: 'refunded' }).eq('id', orderId)
  }

  if (restore_stock && (items?.length ?? 0) > 0) {
    for (const it of items ?? []) {
      const returned = Math.max(0, Number((it as { returned_quantity?: number }).returned_quantity) ?? 0)
      if (returned > 0 && (it as { product_id?: string }).product_id) {
        const pid = (it as { product_id: string }).product_id
        const { data: prod } = await admin.from('products').select('stock').eq('id', pid).single()
        const current = Math.max(0, Number(prod?.stock) ?? 0)
        await admin.from('products').update({ stock: current + returned }).eq('id', pid)
      }
    }
  }

  return NextResponse.json({
    success: true,
    credit_note_filename: fileName,
    amount_eur,
    restore_stock,
  })
}
