import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { getMolliePaymentStatus, findPaymentIdByOrderNumber } from '@/lib/mollie'
import { markOrderAsPaid } from '@/lib/mark-order-paid'

const MAX_ORDERS = 30

export const dynamic = 'force-dynamic'

/**
 * POST – Admin: Alle Bestellungen mit Zahlung „offen“ bei Mollie prüfen und ggf. als bezahlt markieren.
 */
export async function POST(_req: NextRequest) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createSupabaseAdmin()
    const { data: orders, error: listError } = await admin
      .from('orders')
      .select('id, order_number, mollie_payment_id')
      .or('payment_status.is.null,payment_status.neq.paid')
      .order('created_at', { ascending: false })
      .limit(MAX_ORDERS)

    if (listError || !orders?.length) {
      return NextResponse.json({
        success: true,
        checked: 0,
        updated: 0,
        message: orders?.length === 0 ? 'Keine Bestellungen mit offener Zahlung' : listError?.message,
      })
    }

    let updated = 0
    const errors: string[] = []

    for (const order of orders as { id: string; order_number: string; mollie_payment_id?: string | null }[]) {
      let paymentId = order.mollie_payment_id ?? null
      if (!paymentId) {
        paymentId = await findPaymentIdByOrderNumber(order.order_number)
      }
      if (!paymentId) {
        continue
      }
      try {
        const status = await getMolliePaymentStatus(paymentId)
        if (!status.isPaid) continue
        const result = await markOrderAsPaid(order.order_number)
        if (result.ok) updated++
        else errors.push(`${order.order_number}: ${result.error}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`${order.order_number}: ${msg}`)
      }
    }

    return NextResponse.json({
      success: true,
      checked: orders.length,
      updated,
      errors: errors.slice(0, 10),
      message: updated > 0
        ? `${updated} Bestellung(en) als bezahlt übernommen.`
        : errors.length > 0
          ? `Geprüft, keine weiteren Zahlungen bei Mollie. Fehler: ${errors.length}`
          : 'Geprüft, keine weiteren Zahlungen bei Mollie.',
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sync fehlgeschlagen'
    console.error('Admin sync-payments error', e)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
