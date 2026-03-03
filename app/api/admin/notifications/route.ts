import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import {
  canAccessOrders,
  canAccessProducts,
  canAccessInventory,
  canAccessFinances,
  canAccessFeedback,
} from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getFinanceSettings } from '@/lib/finance-settings'

export const dynamic = 'force-dynamic'

export type NotificationAlert = {
  id: string
  type: 'open_requests' | 'open_orders' | 'open_inquiries' | 'unpaid_orders' | 'pending_reviews' | 'open_purchases' | 'revenue_warning' | 'low_stock' | 'open_complaints'
  title: string
  message: string
  href: string
  severity: 'warning' | 'info' | 'error'
  count?: number
}

/**
 * GET – Aggregiert alle wichtigen Hinweise für das Admin-Dashboard:
 * offene Storno/Rücksendeanfragen, offene Kundenanfragen, offene Bestellungen,
 * Zahlung offen, ausstehende Bewertungen, offene Wareneingänge, Umsatz-Warnung,
 * Lager-Warnung, offene Beschwerden.
 */
export async function GET() {
  const { isAdmin, isStaffManager, roles } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const alerts: NotificationAlert[] = []
  const effectiveRoles = roles?.length ? roles : []

  // 1) Offene Storno-/Rücksendeanfragen – nur für Rollen mit Zugriff auf Bestellungen
  const { data: ordersForRequests } = await admin
    .from('orders')
    .select('id, status, cancellation_requested_at, cancellation_request_status, return_requested_at, return_request_status')
  // Storno: offen bis abgelehnt oder Bestellung storniert
  const stornoOffen = (ordersForRequests ?? []).filter(
    (o) => o.cancellation_requested_at && o.status !== 'cancelled' && o.cancellation_request_status !== 'rejected'
  ).length
  // Rücksendung: offen bis abgelehnt oder Rücksendung abgeschlossen
  const retourOffen = (ordersForRequests ?? []).filter(
    (o) => o.return_requested_at && o.return_request_status !== 'rejected' && o.status !== 'return_completed'
  ).length
  const openRequestsCount = stornoOffen + retourOffen
  if (openRequestsCount > 0 && canAccessOrders(effectiveRoles)) {
    alerts.push({
      id: 'open_requests',
      type: 'open_requests',
      title: `${openRequestsCount} offene Anfrage${openRequestsCount !== 1 ? 'n' : ''}`,
      message: 'Stornierungen oder Rücksendungen warten auf Bearbeitung.',
      href: '/admin/requests',
      severity: 'warning',
      count: openRequestsCount,
    })
  }

  // 2) Offene Kundenanfragen – nur für Kundenservice-/Bestell-Rollen
  try {
    const { count: openInquiriesCount } = await admin
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
    const openInquiries = openInquiriesCount ?? 0
    if (openInquiries > 0 && canAccessOrders(effectiveRoles)) {
      alerts.push({
        id: 'open_inquiries',
        type: 'open_inquiries',
        title: `${openInquiries} offene Kundenanfrage${openInquiries !== 1 ? 'n' : ''}`,
        message: 'Kundenanfragen warten auf Bearbeitung im Kundenservice.',
        href: '/admin/support?status=open',
        severity: 'warning',
        count: openInquiries,
      })
    }
  } catch {
    // Tabelle existiert ggf. nicht
  }

  // 3) Offene Bestellungen (bezahlt, noch zu bearbeiten)
  const { count: openOrdersCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('payment_status', 'paid')
    .in('status', ['pending', 'processing'])
  const openOrders = openOrdersCount ?? 0
  if (openOrders > 0 && canAccessOrders(effectiveRoles)) {
    alerts.push({
      id: 'open_orders',
      type: 'open_orders',
      title: `${openOrders} Bestellung${openOrders !== 1 ? 'en' : ''} offen`,
      message: 'Bezahlt, warten auf Bearbeitung/Versand.',
      href: '/admin/orders?filter=ready',
      severity: 'info',
      count: openOrders,
    })
  }

  // 4) Zahlung offen (Bestellungen mit offener Zahlung, nicht storniert)
  let unpaidOrders = 0
  try {
    const { count: unpaidCount } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'cancelled')
      .or('payment_status.neq.paid,payment_status.is.null')
    unpaidOrders = unpaidCount ?? 0
  } catch {
    // Or-Filter oder Schema könnte abweichen
  }
  if (unpaidOrders > 0 && canAccessOrders(effectiveRoles)) {
    alerts.push({
      id: 'unpaid_orders',
      type: 'unpaid_orders',
      title: `${unpaidOrders} Bestellung${unpaidOrders !== 1 ? 'en' : ''} mit offener Zahlung`,
      message: 'Zahlung noch nicht eingegangen oder geprüft.',
      href: '/admin/orders?filter=unpaid',
      severity: 'info',
      count: unpaidOrders,
    })
  }

  // 5) Ausstehende Bewertungs-Moderation
  try {
    const { count: pendingReviewsCount } = await admin
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'pending')
    const pendingReviews = pendingReviewsCount ?? 0
    if (pendingReviews > 0 && canAccessFeedback(effectiveRoles)) {
      alerts.push({
        id: 'pending_reviews',
        type: 'pending_reviews',
        title: `${pendingReviews} Bewertung${pendingReviews !== 1 ? 'en' : ''} zur Moderation`,
        message: 'Produktbewertungen warten auf Freigabe.',
        href: '/admin/feedback',
        severity: 'info',
        count: pendingReviews,
      })
    }
  } catch {
    // Tabelle/Spalte existiert ggf. nicht
  }

  // 6) Offene Einkäufe / Wareneingang (noch nicht vollständig gebucht)
  try {
    const { data: purchases } = await admin
      .from('purchases')
      .select('id')
      .eq('type', 'wareneinkauf')
      .limit(100)
    const purchaseIds = (purchases ?? []).map((p: { id: string }) => p.id)
    if (purchaseIds.length > 0) {
      const { data: items } = await admin
        .from('purchase_items')
        .select('id, quantity, quantity_received')
        .in('purchase_id', purchaseIds)
      const openItems = (items ?? []).filter(
        (i: { quantity?: number; quantity_received?: number }) =>
          Number(i.quantity ?? 0) > Number(i.quantity_received ?? 0)
      )
      if (openItems.length > 0 && canAccessInventory(effectiveRoles)) {
        alerts.push({
          id: 'open_purchases',
          type: 'open_purchases',
          title: `${openItems.length} offene Wareneingang${openItems.length !== 1 ? 'e' : ''}`,
          message: 'Einkaufspositionen warten auf Wareneingangs-Buchung.',
          href: '/admin/inventory/wareneingang',
          severity: 'info',
          count: openItems.length,
        })
      }
    }
  } catch {
    // Tabellen existieren ggf. nicht
  }

  // 7) Umsatz-Warnung (Kleinunternehmer-Grenze)
  const settings = await getFinanceSettings(admin)
  const yearStart = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0)
  const { data: ordersYtd } = await admin
    .from('orders')
    .select('id, total, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', yearStart.toISOString())
  let revenue_ytd = (ordersYtd ?? []).reduce((sum, o) => sum + (Number(o.total) ?? 0), 0)
  try {
    const { data: refundRows } = await admin.from('refunds').select('amount_eur, created_at')
    for (const r of refundRows ?? []) {
      const created = new Date((r as { created_at: string }).created_at)
      if (created >= yearStart) revenue_ytd -= Number(r.amount_eur) ?? 0
    }
  } catch {}
  revenue_ytd = Math.round(revenue_ytd * 100) / 100
  const limit = Number(settings.revenue_limit) ?? 22_500
  const warnGold = 18_000
  const warnRed = 21_000
  if (revenue_ytd >= warnGold && canAccessFinances(effectiveRoles)) {
    const severity: 'warning' | 'error' = revenue_ytd >= warnRed ? 'error' : 'warning'
    const message =
      revenue_ytd >= limit
        ? `Umsatz aktuelles Jahr ${revenue_ytd.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € – Grenze ${limit.toLocaleString('de-DE')} €. Steuerberater kontaktieren.`
        : revenue_ytd >= warnRed
          ? `Umsatz ${revenue_ytd.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € – nahe an ${limit.toLocaleString('de-DE')} €. Steuerberater kontaktieren.`
          : `Umsatz ${revenue_ytd.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € – Hinweis auf Kleinunternehmer-Grenze ${limit.toLocaleString('de-DE')} €.`
    alerts.push({
      id: 'revenue_warning',
      type: 'revenue_warning',
      title: 'Umsatz-Hinweis',
      message,
      href: '/admin/finances',
      severity,
    })
  }

  // 8) Lager: Produkte unter Mindestbestand oder in <7 Tagen leer
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data: orders30 } = await admin.from('orders').select('id').eq('payment_status', 'paid').gte('created_at', since.toISOString())
  const orderIds = (orders30 ?? []).map((o) => o.id)
  let items: { product_id: string; quantity: number }[] = []
  if (orderIds.length > 0) {
    const { data: orderItems } = await admin.from('order_items').select('product_id, quantity').in('order_id', orderIds)
    items = (orderItems ?? []).filter((i) => i.product_id).map((i) => ({ product_id: i.product_id as string, quantity: Number(i.quantity) || 0 }))
  }
  const soldByProduct: Record<string, number> = {}
  for (const it of items) {
    soldByProduct[it.product_id] = (soldByProduct[it.product_id] ?? 0) + it.quantity
  }
  let minStockByProduct: Record<string, number> = {}
  try {
    const { data: prodsMin } = await admin.from('products').select('id, min_stock_level')
    if (prodsMin) for (const p of prodsMin) minStockByProduct[p.id] = Math.max(0, Number((p as { min_stock_level?: number }).min_stock_level) ?? 0)
  } catch {}
  const { data: products } = await admin.from('products').select('id, name, stock')
  const DAYS = 30
  let lowStockCount = 0
  for (const p of products ?? []) {
    const stock = Math.max(0, Number(p.stock) ?? 0)
    const minLevel = minStockByProduct[p.id] ?? 0
    const sold = soldByProduct[p.id] ?? 0
    const avgPerDay = DAYS > 0 ? sold / DAYS : 0
    let daysUntilEmpty: number | null = avgPerDay > 0 ? Math.floor(stock / avgPerDay) : stock > 0 ? 999 : null
    const isRed = minLevel > 0 && stock < minLevel
    const isYellow = daysUntilEmpty !== null && daysUntilEmpty < 7 && daysUntilEmpty >= 0 && !isRed
    if (isRed || isYellow) lowStockCount++
  }
  if (lowStockCount > 0 && canAccessInventory(effectiveRoles)) {
    alerts.push({
      id: 'low_stock',
      type: 'low_stock',
      title: `${lowStockCount} Produkt${lowStockCount !== 1 ? 'e' : ''} mit Lager-Hinweis`,
      message: 'Unter Mindestbestand oder voraussichtlich in unter 7 Tagen ausverkauft.',
      href: '/admin/inventory',
      severity: 'warning',
      count: lowStockCount,
    })
  }

  // 9) Offene Beschwerden (ungelesen) – nur für Inhaber/Chef
  if (isStaffManager) {
    const { count: complaintsCount } = await admin
      .from('staff_complaints')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
    const openComplaints = complaintsCount ?? 0
    if (openComplaints > 0) {
      alerts.push({
        id: 'open_complaints',
        type: 'open_complaints',
        title: `${openComplaints} ungelesene Beschwerde${openComplaints !== 1 ? 'n' : ''}`,
        message: 'Mitarbeiter-Beschwerden warten auf Kenntnisnahme.',
        href: '/admin/complaints',
        severity: 'info',
        count: openComplaints,
      })
    }
  }

  return NextResponse.json({ alerts, count: alerts.length })
}
