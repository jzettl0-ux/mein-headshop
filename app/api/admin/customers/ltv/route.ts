import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Customer Lifetime Value: Gesamtumsatz pro Kunde (customer_email). */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: orders } = await admin
    .from('orders')
    .select('customer_email, customer_name, total')
    .eq('payment_status', 'paid')

  const byEmail: Record<string, { email: string; name: string; total: number; count: number }> = {}
  for (const o of orders ?? []) {
    const email = (o.customer_email || '').trim().toLowerCase()
    if (!email) continue
    const total = Number(o.total) ?? 0
    if (!byEmail[email]) {
      byEmail[email] = { email: o.customer_email as string, name: (o.customer_name as string) || email, total: 0, count: 0 }
    }
    byEmail[email].total += total
    byEmail[email].count += 1
  }

  try {
    const { data: refunds } = await admin.from('refunds').select('order_id, amount_eur')
    if (refunds?.length) {
      const orderIds = [...new Set(refunds.map((r) => r.order_id))]
      const { data: orderEmails } = await admin.from('orders').select('id, customer_email').in('id', orderIds)
      const emailByOrderId: Record<string, string> = {}
      for (const o of orderEmails ?? []) {
        emailByOrderId[o.id] = (o.customer_email || '').trim().toLowerCase()
      }
      for (const r of refunds) {
        const email = emailByOrderId[r.order_id]
        if (email && byEmail[email]) {
          byEmail[email].total -= Number(r.amount_eur) ?? 0
        }
      }
    }
  } catch {
    // refunds-Tabelle optional
  }

  const list = Object.values(byEmail)
    .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({ customers: list })
}
