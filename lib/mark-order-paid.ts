import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getFinanceSettings, calcTransactionFee, calcTaxReserve } from '@/lib/finance-settings'
import { insertLedgerEntriesForOrder } from '@/lib/ledger'
import { createSelfBillingCreditNotesForOrder } from '@/lib/self-billing'
import { generateXRechnungCustomerXml } from '@/lib/xrechnung'
import { embedXrechnungInPdf } from '@/lib/zugferd-embed'
import { getDestinationCountryCode } from '@/lib/eu-vat'
import { generateInvoicePdf } from '@/lib/invoice-pdf'
import { sendOrderConfirmationEmail } from '@/lib/send-order-email'
import { notifySuppliersForOrder } from '@/lib/dropship-notify'
import { addLoyaltyPoints, ensureLoyaltyAccount, getLoyaltySettings } from '@/lib/loyalty'
import { REFERRAL_POINTS_REWARD } from '@/lib/referral'
import { sendReferralSuccessEmail } from '@/lib/send-order-email'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * Bestellung als bezahlt markieren: Status setzen, Rechnung erzeugen & hochladen, Bestätigungs-E-Mail senden.
 * Wird vom Webhook und vom Sync (Success-Page) genutzt.
 */
export async function markOrderAsPaid(orderNumber: string): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabaseAdmin()) {
    return {
      ok: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY fehlt. In .env.local (lokal) bzw. in den Umgebungsvariablen (z. B. Vercel) setzen – wird zum Speichern von Rechnung und Zahlungsstatus benötigt.',
    }
  }

  const admin = createSupabaseAdmin()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (orderError || !order) {
    return { ok: false, error: 'Bestellung nicht gefunden' }
  }

  if ((order as { payment_status?: string }).payment_status === 'paid') {
    return { ok: true }
  }

  const { data: items } = await admin
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)

  const productIds = [...new Set((items || []).map((i: { product_id?: string }) => i.product_id).filter(Boolean))] as string[]
  const slugByProductId: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await admin.from('products').select('id, slug').in('id', productIds)
    for (const p of products || []) {
      if (p?.slug) slugByProductId[p.id] = p.slug
    }
  }

  let invoiceUrl: string | null = null

  const invoicePayload = {
    order_number: order.order_number,
    created_at: order.created_at,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    billing_address: order.billing_address || order.shipping_address || {},
    shipping_address: order.shipping_address,
    payment_method: order.payment_method || 'mollie',
    items: (items || []).map((i: { product_name: string; quantity: number; price: number; total: number }) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      price: Number(i.price),
      total: Number(i.total),
    })),
    subtotal: Number(order.subtotal),
    shipping_cost: Number(order.shipping_cost),
    discount_amount: Number(order.discount_amount) || 0,
    total: Number(order.total),
    has_adult_items: order.has_adult_items,
  }

  let logoUrl: string | undefined
  const { data: logoRow } = await admin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle()
  if (logoRow?.value?.trim()) logoUrl = String(logoRow.value).trim()

  const pdfBytes = await generateInvoicePdf(invoicePayload, { logoUrl })
  const fileName = `rechnung-${orderNumber}.pdf`
  let invoiceXmlUrl: string | null = null

  try {
    const issueDate = new Date().toISOString().slice(0, 10)
    const xml = generateXRechnungCustomerXml({
      invoiceNumber: orderNumber,
      issueDate,
      orderNumber,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      billingAddress: (order.billing_address as Record<string, string>) || (order.shipping_address as Record<string, string>) || {},
      items: (items || []).map((i: { product_name: string; quantity: number; price: number; total: number }) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        price: Number(i.price),
        total: Number(i.total),
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discountAmount: Number(order.discount_amount) || 0,
      total: Number(order.total),
      paymentMethod: order.payment_method || 'mollie',
    })

    const zugferdPdfBytes = await embedXrechnungInPdf(pdfBytes, xml)
    const { error: uploadError } = await admin.storage
      .from('invoices')
      .upload(fileName, zugferdPdfBytes, { contentType: 'application/pdf', upsert: true })
    if (!uploadError) invoiceUrl = fileName

    const xmlFileName = `xrechnung-${orderNumber}.xml`
    const { error: xmlUploadError } = await admin.storage
      .from('invoices')
      .upload(xmlFileName, Buffer.from(xml, 'utf-8'), { contentType: 'application/xml', upsert: true })
    if (!xmlUploadError) invoiceXmlUrl = xmlFileName
  } catch (xmlErr) {
    console.warn('markOrderAsPaid: ZUGFeRD/XRechnung error', xmlErr)
    const { error: fallbackError } = await admin.storage
      .from('invoices')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })
    if (!fallbackError) invoiceUrl = fileName
  }

  const { error: stockError } = await admin.rpc('decrement_stock_for_order', {
    p_order_id: order.id,
  })
  if (stockError) {
    console.warn('markOrderAsPaid: RPC fehlgeschlagen, reduziere Bestand manuell:', stockError.message)
    for (const item of (items || []) as { product_id: string; quantity: number }[]) {
      const productId = item.product_id
      const qty = Math.max(0, Number(item.quantity) || 0)
      if (!productId || qty === 0) continue
      const { data: prod, error: fetchErr } = await admin.from('products').select('stock').eq('id', productId).single()
      if (fetchErr || !prod) continue
      const current = Math.max(0, Number(prod.stock) ?? 0)
      const newStock = Math.max(0, current - qty)
      await admin.from('products').update({ stock: newStock }).eq('id', productId)
    }
  }

  const settings = await getFinanceSettings(admin)
  const orderTotal = Number(order.total) ?? 0
  const transaction_fee = Math.round(calcTransactionFee(orderTotal, settings) * 100) / 100
  let cogs = 0
  if (productIds.length > 0) {
    const { data: costRows } = await admin.from('products').select('id, cost_price').in('id', productIds)
    const costByProductId: Record<string, number> = {}
    for (const r of costRows || []) {
      costByProductId[r.id] = Number(r.cost_price) ?? 0
    }
    for (const it of (items || []) as { product_id: string; quantity: number }[]) {
      const cost = it.product_id ? costByProductId[it.product_id] ?? 0 : 0
      cogs += cost * (Number(it.quantity) || 0)
    }
  }
  cogs = Math.round(cogs * 100) / 100
  const net_profit = Math.round((orderTotal - cogs - transaction_fee) * 100) / 100
  const tax_reserve = calcTaxReserve(net_profit, settings)

  const orderUpdate: Record<string, unknown> = {
    payment_status: 'paid',
    status: 'processing',
    invoice_url: invoiceUrl,
    transaction_fee,
    tax_reserve,
    net_profit,
  }
  if (invoiceXmlUrl) orderUpdate.invoice_xml_url = invoiceXmlUrl
  const { error: updateError } = await admin
    .from('orders')
    .update(orderUpdate)
    .eq('order_number', orderNumber)

  if (updateError) {
    console.error('markOrderAsPaid: update error', updateError)
    return { ok: false, error: updateError.message }
  }

  try {
    const destCountry = (order as { destination_country?: string }).destination_country
      || getDestinationCountryCode((order.shipping_address || order.billing_address) as { country?: string } | null)
    await insertLedgerEntriesForOrder(admin, order.id, {
      id: order.id,
      subtotal: Number(order.subtotal) ?? 0,
      shipping_cost: Number(order.shipping_cost) ?? 0,
    }, {
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      buyer_vat_id: null,
      destination_country: destCountry,
    })
  } catch (e) {
    console.error('markOrderAsPaid: ledger insert error', e)
  }

  try {
    await createSelfBillingCreditNotesForOrder(admin, order.id)
  } catch (e) {
    console.error('markOrderAsPaid: self-billing credit notes error', e)
  }

  try {
    await sendOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      items: (items || []).map((i: { product_name: string; quantity: number; price: number; product_id?: string; product_image?: string | null }) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: Number(i.price),
        product_slug: i.product_id ? slugByProductId[i.product_id] : undefined,
        product_image: i.product_image && String(i.product_image).trim() ? String(i.product_image).trim() : undefined,
      })),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping_cost),
      total: Number(order.total),
      shippingAddress: order.shipping_address || {},
      hasAdultItems: Boolean(order.has_adult_items),
      accountOrdersUrl: `${BASE_URL}/account`,
      invoicePdfBytes: pdfBytes,
      invoicePdfFileName: fileName,
    })
  } catch (e) {
    console.error('markOrderAsPaid: email error', e)
  }

  try {
    await notifySuppliersForOrder(order.id)
  } catch (e) {
    console.error('markOrderAsPaid: dropship notify error', e)
  }

  const userId = (order as { user_id?: string | null }).user_id
  if (userId) {
    try {
      const settings = await getLoyaltySettings(admin)
      if (settings.enabled) {
        await ensureLoyaltyAccount(admin, userId)
        const orderTotal = Number(order.total) ?? 0
        const pointsToAdd = Math.floor(orderTotal * settings.points_per_euro)
        if (pointsToAdd > 0) {
          await addLoyaltyPoints(admin, userId, pointsToAdd, 'order', 'order', order.id)
        }
        const pointsRedeemed = Number((order as { loyalty_points_redeemed?: number }).loyalty_points_redeemed) || 0
        if (pointsRedeemed > 0) {
          await addLoyaltyPoints(admin, userId, -pointsRedeemed, 'redemption', 'order', order.id)
        }
      }
    } catch (e) {
      console.error('markOrderAsPaid: loyalty points error', e)
    }
  }

  // Referral: Wenn die Bestellung einen Empfehlungscode hatte, Empfehlung als erfüllt markieren, Werber belohnen, E-Mail senden
  try {
    const { data: referral } = await admin
      .from('referrals')
      .select('id, referrer_user_id, status')
      .eq('order_id', order.id)
      .maybeSingle()
    if (referral && referral.status === 'pending') {
      await admin
        .from('referrals')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', referral.id)
      const referrerUserId = referral.referrer_user_id as string
      await ensureLoyaltyAccount(admin, referrerUserId)
      await addLoyaltyPoints(admin, referrerUserId, REFERRAL_POINTS_REWARD, 'adjustment', 'referral', referral.id)
      const { data: { user: referrerUser } } = await admin.auth.admin.getUserById(referrerUserId)
      const referrerEmail = referrerUser?.email
      if (referrerEmail) {
        await sendReferralSuccessEmail({
          to: referrerEmail,
          rewardText: `${REFERRAL_POINTS_REWARD} Treuepunkte`,
        })
      }
    }
  } catch (e) {
    console.error('markOrderAsPaid: referral completion error', e)
  }

  // Affiliate: Bei affiliate_code Provision anlegen
  const affiliateCode = (order as { affiliate_code?: string | null }).affiliate_code
  if (typeof affiliateCode === 'string' && affiliateCode.trim()) {
    try {
      const { data: link } = await admin
        .schema('advanced_ops')
        .from('affiliate_links')
        .select('id, commission_percent')
        .eq('code', affiliateCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle()
      if (link) {
        const orderTotal = Number(order.total) ?? 0
        const commissionPercent = Number(link.commission_percent) ?? 0
        const commissionEur = Math.round((orderTotal * commissionPercent / 100) * 100) / 100
        if (commissionEur > 0) {
          await admin
            .schema('advanced_ops')
            .from('affiliate_commissions')
            .upsert({
              affiliate_link_id: link.id,
              order_id: order.id,
              order_total: orderTotal,
              commission_eur: commissionEur,
              status: 'pending',
            }, { onConflict: 'order_id' })
        }
      }
    } catch (e) {
      console.error('markOrderAsPaid: affiliate commission error', e)
    }
  }

  try {
    const { sendPurchaseEvent } = await import('@/lib/tracking-server')
    await sendPurchaseEvent({
      order_number: order.order_number,
      value: Number(order.total) ?? 0,
      currency: 'EUR',
      item_count: (items || []).length,
      transaction_id: order.order_number,
    })
  } catch (e) {
    console.error('markOrderAsPaid: server-side purchase tracking error', e)
  }

  return { ok: true }
}
