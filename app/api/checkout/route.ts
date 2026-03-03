import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getReservedByProductIds } from '@/lib/get-reserved-stock'
import { createMolliePayment } from '@/lib/mollie'
import { sendOrderReceivedEmail } from '@/lib/send-order-email'
import { getLoyaltySettings } from '@/lib/loyalty'
import {
  REFERRAL_DISCOUNT_EUR,
  REFERRAL_MIN_ORDER_SUBTOTAL,
  isValidReferralCodeFormat,
} from '@/lib/referral'
import { checkRateLimit } from '@/lib/rate-limit'
import { getBuyboxWinners } from '@/lib/get-buybox-winners'
import { calculatePaymentSplits } from '@/lib/calculate-payment-splits'
import { getTieredUnitPrice } from '@/lib/b2b-tiers'
import { checkB2BPolicies } from '@/lib/b2b-policy-check'

const IDENT_CHECK_FEE = 2.0
/** Honeypot-Feldname: darf vom Client nicht gesendet werden (Bot-Abwehr). */
const HONEYPOT_FIELD = 'company_website'
const BASE_SHIPPING = 4.9
const FREE_SHIPPING_THRESHOLD = 50

/**
 * POST /api/checkout
 * Erstellt Bestellung in Supabase, dann Mollie-Payment.
 * Gesamtbetrag inkl. 2,00 € Ident-Check bei 18+ ist bereits im Frontend berechnet (getShipping).
 * Gibt checkoutUrl zurück → Frontend leitet zu Mollie weiter.
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  return `checkout:${ip}`
}

export async function POST(request: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getClientIdentifier(request), 10, 60)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte kurz warten.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    if (body[HONEYPOT_FIELD] != null && String(body[HONEYPOT_FIELD]).trim() !== '') {
      return NextResponse.json({ success: true })
    }

    const {
      orderNumber,
      user_id,
      customer_email,
      customer_name,
      shipping_address,
      billing_address,
      items,
      has_adult_items,
      discount_code,
      discount_amount,
      loyalty_points_redeemed,
      loyalty_tier_discount_amount,
      referral_code: referralCodeRaw,
      affiliate_code: affiliateCodeRaw,
      cart_session_id,
      order_note: orderNoteRaw,
      age_verification_token,
      payment_mode: paymentModeRaw,
    } = body

    const paymentModeSplit = paymentModeRaw === 'split'

    if (!orderNumber || !customer_email || !customer_name || !shipping_address || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // AVS: Bei 18+ Produkten Altersverifizierungs-Token erforderlich
    if (Boolean(has_adult_items)) {
      const token = typeof age_verification_token === 'string' ? age_verification_token.trim() : ''
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Altersverifizierung erforderlich. Bitte bestätigen Sie Ihr Alter, bevor Sie fortfahren.' },
          { status: 400 }
        )
      }
      if (hasSupabaseAdmin()) {
        const admin = createSupabaseAdmin()
        const { data: tokenRow } = await admin
          .from('age_verification_tokens')
          .select('token, expires_at, used_at')
          .eq('token', token)
          .maybeSingle()
        if (!tokenRow) {
          return NextResponse.json(
            { success: false, error: 'Altersverifizierung ungültig oder abgelaufen. Bitte starten Sie die Prüfung erneut.' },
            { status: 400 }
          )
        }
        if (tokenRow.used_at) {
          return NextResponse.json(
            { success: false, error: 'Altersverifizierungs-Token wurde bereits verwendet. Bitte starten Sie die Prüfung erneut.' },
            { status: 400 }
          )
        }
        if (new Date() > new Date(tokenRow.expires_at)) {
          return NextResponse.json(
            { success: false, error: 'Altersverifizierung abgelaufen. Bitte bestätigen Sie Ihr Alter erneut.' },
            { status: 400 }
          )
        }
        await admin.from('age_verification_tokens').update({ used_at: new Date().toISOString() }).eq('token', token)
      } else {
        return NextResponse.json(
          { success: false, error: 'Altersverifizierung konnte nicht geprüft werden. Bitte versuchen Sie es später erneut.' },
          { status: 500 }
        )
      }
    }

    const supabase = await createServerSupabase()
    const admin = hasSupabaseAdmin() ? createSupabaseAdmin() : null
    const clientForBuybox = admin ?? supabase

    // Preise und Namen nur aus der DB (verhindert Preis-Manipulation)
    const productIds = [...new Set((items as { product_id: string }[]).map((i) => i.product_id).filter(Boolean))]
    if (productIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Ungültige Produkte' }, { status: 400 })
    }
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, name, stock, is_active')
      .in('id', productIds)
    if (productsError || !products?.length) {
      return NextResponse.json({ success: false, error: 'Produkte nicht gefunden' }, { status: 400 })
    }

    const buyboxMap = await getBuyboxWinners(clientForBuybox, productIds)
    const reserved = hasSupabaseAdmin() ? await getReservedByProductIds(productIds) : {}
    let tieredByProduct: Record<string, { min_quantity: number; unit_price: number }[]> = {}
    let hasB2BApproved = false
    if (admin && user_id) {
      const { data: b2b } = await admin.schema('b2b').from('business_accounts').select('id').eq('user_id', user_id).eq('status', 'approved').maybeSingle()
      if (b2b) {
        hasB2BApproved = true
        const { data: tiers } = await admin.schema('b2b').from('tiered_pricing').select('product_id, min_quantity, unit_price').in('product_id', productIds)
        for (const t of tiers ?? []) {
          const pid = t.product_id
          if (!pid) continue
          if (!tieredByProduct[pid]) tieredByProduct[pid] = []
          tieredByProduct[pid].push({ min_quantity: Number(t.min_quantity), unit_price: Number(t.unit_price) })
        }
      }
    }
    const productMap = new Map(
      products.map((p) => {
        const stock = Number(p.stock) ?? 0
        const res = reserved[p.id] ?? 0
        const winner = buyboxMap.get(p.id)
        const availableStock = winner ? Number(winner.stock ?? 0) : stock
        const available = Math.max(0, availableStock - res)
        const price = winner ? winner.unit_price : Number(p.price)
        return [
          p.id,
          {
            price,
            name: p.name,
            stock: winner ? winner.stock : stock,
            available,
            is_active: p.is_active !== false,
            vendor_id: winner?.vendor_id ?? null,
            offer_id: winner?.offer_id ?? null,
            seller_type: (winner?.seller_type ?? 'shop') as 'shop' | 'vendor',
            fulfillment_type: (winner?.fulfillment_type ?? 'fbm') as 'fbm' | 'fba',
          },
        ]
      })
    )

    // BLV-Schutz: Jeder vom Client übermittelte Preis muss mit dem DB-Preis übereinstimmen (Toleranz 1 Ct)
    const PRICE_TOLERANCE = 0.01
    let subtotal = 0
    const validatedItems: {
      product_id: string
      product_name: string
      product_image?: string
      quantity: number
      price: number
      vendor_id: string | null
      offer_id: string | null
      seller_type: 'shop' | 'vendor'
      fulfillment_type: 'fbm' | 'fba'
    }[] = []
    for (const item of items as { product_id: string; product_name?: string; product_image?: string; quantity: number; price?: number }[]) {
      const product = productMap.get(item.product_id)
      if (!product) {
        return NextResponse.json({ success: false, error: `Produkt ${item.product_id} nicht verfügbar` }, { status: 400 })
      }
      if (!product.is_active) {
        return NextResponse.json({ success: false, error: `Produkt "${product.name}" ist derzeit nicht im Shop verfügbar` }, { status: 400 })
      }
      const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)))
      const available = product.available
      if (quantity > available) {
        return NextResponse.json(
          { success: false, error: `Nicht genug Lagerbestand für ${product.name}` },
          { status: 400 }
        )
      }
      const unitPrice = hasB2BApproved && tieredByProduct[item.product_id]?.length
        ? getTieredUnitPrice(product.price, quantity, tieredByProduct[item.product_id])
        : product.price
      const clientPrice = typeof item.price === 'number' ? item.price : Number(item.price)
      const useTiered = hasB2BApproved && tieredByProduct[item.product_id]?.length
      if (!useTiered && !Number.isNaN(clientPrice) && Math.abs(clientPrice - unitPrice) > PRICE_TOLERANCE) {
        return NextResponse.json(
          { success: false, error: 'Preisabweichung erkannt. Bitte lade den Warenkorb neu.' },
          { status: 400 }
        )
      }
      const lineTotal = unitPrice * quantity
      subtotal += lineTotal
      validatedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        product_image: item.product_image,
        quantity,
        price: unitPrice,
        vendor_id: product.vendor_id,
        offer_id: product.offer_id,
        seller_type: product.seller_type,
        fulfillment_type: product.fulfillment_type,
      })
    }

    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
    const shipping_cost =
      (freeShipping ? 0 : BASE_SHIPPING) + (has_adult_items ? IDENT_CHECK_FEE : 0)
    const discountAmount = Math.min(subtotal, Math.max(0, Number(discount_amount) ?? 0))
    let loyaltyTierDiscount = Math.min(subtotal - discountAmount, Math.max(0, Number(loyalty_tier_discount_amount) ?? 0))
    let pointsRedeemed = Math.max(0, Math.floor(Number(loyalty_points_redeemed) ?? 0))
    let pointsDiscountEuro = 0
    if (hasSupabaseAdmin() && user_id) {
      const admin = createSupabaseAdmin()
      const loyaltySettings = await getLoyaltySettings(admin)
      if (!loyaltySettings.enabled) {
        loyaltyTierDiscount = 0
        pointsRedeemed = 0
      } else {
        const minOrder = loyaltySettings.min_order_eur_for_discount ?? 0
        if (loyaltyTierDiscount > 0 && subtotal < minOrder) loyaltyTierDiscount = 0
      }
      if (pointsRedeemed > 0) {
        const { data: acc } = await admin.from('loyalty_accounts').select('points_balance').eq('user_id', user_id).maybeSingle()
        const balance = acc?.points_balance ?? 0
        pointsRedeemed = Math.min(pointsRedeemed, balance)
        pointsDiscountEuro = pointsRedeemed / loyaltySettings.points_per_eur_discount
        const maxPointsDiscount = Math.max(0, subtotal - discountAmount - loyaltyTierDiscount)
        pointsDiscountEuro = Math.min(pointsDiscountEuro, maxPointsDiscount)
        pointsRedeemed = Math.floor(pointsDiscountEuro * loyaltySettings.points_per_eur_discount)
      }
    }
    let referralDiscount = 0
    let referralCodeToStore: string | null = null
    const referralCode = typeof referralCodeRaw === 'string' ? referralCodeRaw.trim().toUpperCase() : ''
    if (
      hasSupabaseAdmin() &&
      referralCode &&
      isValidReferralCodeFormat(referralCode) &&
      subtotal >= REFERRAL_MIN_ORDER_SUBTOTAL
    ) {
      const admin = createSupabaseAdmin()
      const { data: codeRow } = await admin
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode)
        .maybeSingle()
      const referrerUserId = codeRow?.user_id as string | undefined
      if (referrerUserId && referrerUserId !== (user_id ?? '')) {
        const { data: existing } = await admin
          .from('referrals')
          .select('id')
          .eq('referred_email', String(customer_email).trim().toLowerCase())
          .eq('status', 'completed')
          .maybeSingle()
        if (!existing) {
          referralDiscount = Math.min(REFERRAL_DISCOUNT_EUR, subtotal + shipping_cost - discountAmount - loyaltyTierDiscount - pointsDiscountEuro)
          referralDiscount = Math.max(0, referralDiscount)
          if (referralDiscount > 0) referralCodeToStore = referralCode
        }
      }
    }
    const total = Math.max(0, subtotal + shipping_cost - discountAmount - loyaltyTierDiscount - pointsDiscountEuro - referralDiscount)

    let needsB2BApproval = false
    let violatedPolicyId: string | null = null
    const b2bAccount = hasB2BApproved && admin && user_id
      ? (await admin.schema('b2b').from('business_accounts').select('id').eq('user_id', user_id).eq('status', 'approved').maybeSingle()).data
      : null
    if (b2bAccount?.id && admin) {
      const policyResult = await checkB2BPolicies(
        admin,
        b2bAccount.id,
        total,
        validatedItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price, vendor_id: i.vendor_id })),
      )
      if (policyResult.blockReason) {
        return NextResponse.json({ success: false, error: policyResult.blockReason }, { status: 400 })
      }
      if (policyResult.requireApproval && policyResult.violation) {
        needsB2BApproval = true
        violatedPolicyId = policyResult.violation.policy_id
      }
    }

    const destCountry = (() => {
      const c = (shipping_address as { country?: string })?.country || ''
      if (!c) return 'DE'
      if (c === 'Deutschland' || c === 'DE') return 'DE'
      if (c.length === 2) return c.toUpperCase()
      const map: Record<string, string> = { Österreich: 'AT', Belgium: 'BE', France: 'FR', Netherlands: 'NL', Austria: 'AT' }
      return map[c] || c.slice(0, 2).toUpperCase() || 'DE'
    })()

    const orderPayload = {
      order_number: orderNumber,
      destination_country: destCountry,
      user_id: user_id ?? null,
      customer_email: String(customer_email).trim(),
      customer_name: String(customer_name).trim(),
      shipping_address,
      billing_address: billing_address ?? shipping_address,
      subtotal,
      shipping_cost,
      total,
      status: needsB2BApproval ? 'approval_pending' : 'pending',
      ...(needsB2BApproval && b2bAccount?.id && { b2b_account_id: b2bAccount.id }),
      has_adult_items: Boolean(has_adult_items),
      payment_method: 'mollie',
      payment_status: 'pending',
      discount_code: discount_code ?? null,
      discount_amount: discountAmount,
      loyalty_points_redeemed: pointsRedeemed,
      loyalty_tier_discount_amount: loyaltyTierDiscount,
      referral_code: referralCodeToStore,
      referral_discount_amount: referralDiscount,
      affiliate_code: typeof affiliateCodeRaw === 'string' && affiliateCodeRaw.trim() ? affiliateCodeRaw.trim().toUpperCase() : null,
      order_note: orderNoteRaw != null && String(orderNoteRaw).trim() !== '' ? String(orderNoteRaw).trim() : null,
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload as never)
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', orderError)
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      )
    }

    const order = orderData as { id: string }

    // Order Lines pro Vendor (Phase 3: Multi-Vendor)
    const orderLineMap = new Map<string, { id: string; subtotal: number }>()
    if (admin) {
      const groups = new Map<string, { subtotal: number; vendor_id: string | null; seller_type: string; fulfillment_type: string }>()
      for (const item of validatedItems) {
        const key = `${item.vendor_id ?? 'shop'}|${item.seller_type}|${item.fulfillment_type}`
        const lineTotal = item.price * item.quantity
        const prev = groups.get(key)
        if (prev) {
          prev.subtotal += lineTotal
        } else {
          groups.set(key, {
            subtotal: lineTotal,
            vendor_id: item.vendor_id,
            seller_type: item.seller_type,
            fulfillment_type: item.fulfillment_type,
          })
        }
      }
      for (const [key, g] of groups) {
        const { data: line, error: lineErr } = await admin
          .schema('fulfillment')
          .from('order_lines')
          .insert({
            order_id: order.id,
            vendor_id: g.vendor_id,
            seller_type: g.seller_type,
            fulfillment_type: g.fulfillment_type,
            subtotal: g.subtotal,
            status: 'pending',
          })
          .select('id')
          .single()
        if (!lineErr && line?.id) {
          orderLineMap.set(key, { id: line.id, subtotal: g.subtotal })
        }
      }
    }

    const getOrderLineId = (item: (typeof validatedItems)[0]) => {
      const key = `${item.vendor_id ?? 'shop'}|${item.seller_type}|${item.fulfillment_type}`
      return orderLineMap.get(key)?.id ?? null
    }

    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image ?? null,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      vendor_id: item.vendor_id,
      offer_id: item.offer_id,
      fulfillment_type: item.fulfillment_type,
      seller_type: item.seller_type,
      order_line_id: getOrderLineId(item),
    }))

    const insertClient = admin ?? supabase
    const { error: itemsError } = await insertClient
      .from('order_items')
      .insert(orderItems as never)

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      )
    }

    if (cart_session_id && typeof cart_session_id === 'string' && cart_session_id.trim() && hasSupabaseAdmin()) {
      createSupabaseAdmin().from('stock_reservations').delete().eq('session_id', cart_session_id.trim()).then(() => {})
    }

    if (referralCodeToStore && referralDiscount > 0 && hasSupabaseAdmin()) {
      const adminRef = createSupabaseAdmin()
      const { data: codeRow } = await adminRef.from('referral_codes').select('user_id').eq('code', referralCodeToStore).maybeSingle()
      if (codeRow?.user_id) {
        await adminRef.from('referrals').insert({
          referrer_user_id: codeRow.user_id,
          referral_code: referralCodeToStore,
          referred_email: String(customer_email).trim().toLowerCase(),
          referred_user_id: user_id ?? null,
          order_id: order.id,
          status: 'pending',
        })
      }
    }

    if (needsB2BApproval && admin && user_id && b2bAccount?.id) {
      await admin.schema('b2b').from('order_approvals').insert({
        order_id: order.id,
        b2b_account_id: b2bAccount.id,
        requested_by_user_id: user_id,
        violated_policy_id: violatedPolicyId,
        status: 'PENDING',
      })
      try {
        const { sendB2BOrderPendingApprovalEmail } = await import('@/lib/send-order-email')
        await sendB2BOrderPendingApprovalEmail({
          customerEmail: String(customer_email).trim(),
          customerName: String(customer_name).trim(),
          orderNumber,
          total,
        })
      } catch (e) {
        console.error('B2B approval email failed', e)
      }
      return NextResponse.json({
        success: true,
        needs_approval: true,
        requiresApproval: true,
        orderNumber,
        message: 'Ihre Bestellung wurde erstellt und wartet auf Freigabe durch Ihren Einkaufsverantwortlichen.',
      })
    }

    // Blueprint Split Payment: Mit Freunden teilen (nur für eingeloggte Nutzer)
    if (paymentModeSplit && user_id && hasSupabaseAdmin() && total > 0) {
      const admin = createSupabaseAdmin()
      const { randomBytes } = await import('crypto')
      const shareToken = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: splitData, error: splitErr } = await admin
        .schema('checkout')
        .from('split_payments')
        .insert({
          order_id: order.id,
          initiator_customer_id: user_id,
          total_order_amount: total,
          total_paid_so_far: 0,
          share_token: shareToken,
          status: 'AWAITING_FUNDS',
          expires_at: expiresAt.toISOString(),
        })
        .select('split_id')
        .single()

      if (!splitErr && splitData) {
        await admin
          .schema('checkout')
          .from('split_payment_participants')
          .insert({
            split_id: splitData.split_id,
            customer_id: user_id,
            amount_assigned: total,
            amount_paid: 0,
            payment_status: 'PENDING',
          })

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        return NextResponse.json({
          success: true,
          split_token: shareToken,
          split_url: `${baseUrl}/split/${shareToken}`,
          orderNumber,
          message: 'Rechnung zum Teilen erstellt. Teile den Link mit Freunden.',
        })
      }
    }

    // Phase 11.3: Coupon-Budget erhöhen
    if (discount_code && discountAmount > 0 && hasSupabaseAdmin()) {
      const adminRef = createSupabaseAdmin()
      const { data: dcRow } = await adminRef.from('discount_codes').select('id').eq('code', String(discount_code).trim().toUpperCase()).maybeSingle()
      if (dcRow?.id) {
        const { data: coupon } = await adminRef.schema('advanced_ops').from('coupons').select('id, budget_used_eur').eq('discount_code_id', dcRow.id).maybeSingle()
        if (coupon) {
          const used = Number(coupon.budget_used_eur ?? 0)
          await adminRef.schema('advanced_ops').from('coupons').update({ budget_used_eur: used + discountAmount, updated_at: new Date().toISOString() }).eq('id', coupon.id)
        }
      }
    }

    // Sofort „Bestellung eingegangen“ an Kunden senden (Hinweis: Zahlung wird geprüft, weitere Infos per E-Mail)
    const shippingAddr = shipping_address as { street?: string; house_number?: string; postal_code?: string; city?: string }
    sendOrderReceivedEmail({
      orderNumber,
      customerName: String(customer_name).trim(),
      customerEmail: String(customer_email).trim(),
      items: validatedItems.map((i) => ({ name: i.product_name, quantity: i.quantity, price: i.price })),
      subtotal,
      shipping: shipping_cost,
      total,
      shippingAddress: shippingAddr ?? {},
      hasAdultItems: Boolean(has_adult_items),
    }).catch((e) => console.error('Checkout: OrderReceived email failed', e))

    if (total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Der Bestellbetrag muss größer als 0 € sein.' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const isLocalhost = /localhost|127\.0\.0\.1/.test(baseUrl)
    const webhookUrl =
      process.env.MOLLIE_WEBHOOK_URL ||
      (isLocalhost ? undefined : `${baseUrl}/api/payment/webhook`)

    if (!process.env.MOLLIE_API_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Zahlungsanbieter nicht konfiguriert (MOLLIE_API_KEY).' },
        { status: 500 }
      )
    }

    let splitRoutes: { mollie_organization_id: string; amount_eur: number }[] | undefined
    let paymentSplits: { vendor_id: string | null; amount_eur: number; commission_eur: number }[] = []
    if (admin && process.env.MOLLIE_SPLIT_ENABLED === 'true') {
      const splits = await calculatePaymentSplits(admin, order.id)
      if (splits.canUseSplit && splits.routes.length > 0) {
        splitRoutes = splits.routes.map((r) => ({
          mollie_organization_id: r.mollie_organization_id,
          amount_eur: r.net_to_vendor_eur,
        }))
        paymentSplits = splits.routes.map((r) => ({
          vendor_id: r.vendor_id,
          amount_eur: r.net_to_vendor_eur,
          commission_eur: r.commission_eur,
        }))
      }
    }

    const payment = await createMolliePayment({
      orderNumber,
      amount: total,
      description: `Bestellung #${orderNumber} - Premium Headshop`,
      redirectUrl: `${baseUrl}/payment/success?order=${orderNumber}`,
      ...(webhookUrl && { webhookUrl }),
      ...(splitRoutes && splitRoutes.length > 0 && { splitRoutes }),
    })

    await supabase
      .from('orders')
      .update({ mollie_payment_id: payment.paymentId })
      .eq('id', order.id)

    if (admin && paymentSplits.length > 0) {
      await admin.schema('financials').from('order_payment_splits').insert(
        paymentSplits.map((s) => ({
          order_id: order.id,
          mollie_payment_id: payment.paymentId,
          vendor_id: s.vendor_id,
          seller_type: 'vendor',
          amount_eur: s.amount_eur,
          commission_eur: s.commission_eur,
        }))
      )
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.paymentId,
      orderNumber,
    })
  } catch (error: any) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout fehlgeschlagen' },
      { status: 500 }
    )
  }
}
