/**
 * DSGVO Art. 17 – Kundendaten löschen & anonymisieren
 *
 * Regel:
 * - Persönliche Daten löschen oder anonymisieren
 * - Bestellungen: Anonymisieren (Finanzamt-Aufbewahrung § 147 AO, § 257 HGB: 10 Jahre)
 * - Auth-User löschen (CASCADE entfernt addresses, loyalty, referral_codes etc.)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const ANONYMOUS_LABEL = 'Gelöscht (DSGVO Art. 17)'
const ANONYMOUS_EMAIL_PREFIX = 'geloescht-'

export interface GdprDeleteResult {
  success: boolean
  error?: string
  anonymizedOrders: number
  anonymizedInquiries: number
  anonymizedReviews: number
  anonymizedReferrals: number
}

/**
 * Anonymisiert Bestellungen eines Nutzers.
 * Behält: order_number, subtotal, shipping_cost, total, status, order_items (für Finanzamt).
 * Entfernt: customer_name, customer_email, shipping_address, billing_address (personenbezogen).
 */
async function anonymizeOrders(
  admin: SupabaseClient,
  userId: string | null,
  customerEmail: string | null
): Promise<number> {
  if (!userId && !customerEmail) return 0

  let query = admin.from('orders').select('id')
  if (userId) query = query.eq('user_id', userId)
  else if (customerEmail) query = query.ilike('customer_email', customerEmail)

  const { data: orders, error } = await query
  if (error || !orders?.length) return 0

  const ids = orders.map((o) => o.id)
  const { error: updateErr } = await admin
    .from('orders')
    .update({
      user_id: null,
      customer_email: ANONYMOUS_EMAIL_PREFIX + ids[0].slice(0, 8),
      customer_name: ANONYMOUS_LABEL,
      shipping_address: {},
      billing_address: {},
    })
    .in('id', ids)

  if (updateErr) {
    console.error('[GDPR] anonymizeOrders error:', updateErr)
    return 0
  }
  return ids.length
}

/**
 * Anonymisiert Kundenanfragen (Kontaktformular) nach E-Mail.
 */
async function anonymizeInquiries(
  admin: SupabaseClient,
  email: string
): Promise<number> {
  const { data: rows, error } = await admin
    .from('customer_inquiries')
    .select('id')
    .ilike('email', email)

  if (error || !rows?.length) return 0

  const { error: updateErr } = await admin
    .from('customer_inquiries')
    .update({
      name: ANONYMOUS_LABEL,
      email: ANONYMOUS_EMAIL_PREFIX + rows[0].id.slice(0, 8),
      message: '[Inhalt aus Datenschutzgründen gelöscht]',
      reply_text: null,
    })
    .in('id', rows.map((r) => r.id))

  if (updateErr) {
    console.error('[GDPR] anonymizeInquiries error:', updateErr)
    return 0
  }
  return rows.length
}

/**
 * Anonymisiert Bewertungen (display_name), die über order_items mit user_id verknüpft sind.
 */
async function anonymizeReviewsForUser(
  admin: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: orderIds } = await admin
    .from('orders')
    .select('id')
    .eq('user_id', userId)
  if (!orderIds?.length) return 0

  const ids = orderIds.map((o) => o.id)
  const { data: orderItems } = await admin
    .from('order_items')
    .select('id')
    .in('order_id', ids)
  if (!orderItems?.length) return 0

  const itemIds = orderItems.map((i) => i.id)
  const { data: reviews } = await admin
    .from('product_reviews')
    .select('id')
    .in('order_item_id', itemIds)
  if (!reviews?.length) return 0

  const { error } = await admin
    .from('product_reviews')
    .update({ display_name: ANONYMOUS_LABEL })
    .in('id', reviews.map((r) => r.id))

  if (error) {
    console.error('[GDPR] anonymizeReviews error:', error)
    return 0
  }
  return reviews.length
}

/**
 * Anonymisiert Empfehlungsdaten (referred_email) wo referrer = user.
 */
async function anonymizeReferralsForUser(
  admin: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: refs, error } = await admin
    .from('referrals')
    .select('id')
    .eq('referrer_user_id', userId)

  if (error || !refs?.length) return 0

  const { error: updateErr } = await admin
    .from('referrals')
    .update({ referred_email: ANONYMOUS_EMAIL_PREFIX + refs[0].id.slice(0, 8) })
    .eq('referrer_user_id', userId)

  if (updateErr) {
    console.error('[GDPR] anonymizeReferrals error:', updateErr)
    return 0
  }
  return refs.length
}

/**
 * Führt die vollständige DSGVO-konforme Löschung durch:
 * 1. Anonymisierung Bestellungen
 * 2. Anonymisierung Anfragen (E-Mail)
 * 3. Anonymisierung Bewertungen
 * 4. Anonymisierung Referrals
 * 5. Löschen Auth-User (CASCADE entfernt addresses, loyalty, referral_codes, etc.)
 *
 * @param admin Supabase Admin Client
 * @param userId Auth User ID (falls Konto vorhanden)
 * @param email E-Mail für Anfragen-/Gast-Bestellungen-Anonymisierung
 */
export async function executeGdprDeletion(
  admin: SupabaseClient,
  userId: string | null,
  email: string
): Promise<GdprDeleteResult> {
  const result: GdprDeleteResult = {
    success: false,
    anonymizedOrders: 0,
    anonymizedInquiries: 0,
    anonymizedReviews: 0,
    anonymizedReferrals: 0,
  }

  try {
    if (userId) {
      result.anonymizedReviews = await anonymizeReviewsForUser(admin, userId)
      result.anonymizedReferrals = await anonymizeReferralsForUser(admin, userId)
    }
    result.anonymizedOrders = await anonymizeOrders(admin, userId, email)
    result.anonymizedInquiries = await anonymizeInquiries(admin, email)

    if (userId) {
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) {
        result.error = error.message
        return result
      }
    }

    result.success = true
    return result
  } catch (e: any) {
    result.error = e?.message ?? 'Unbekannter Fehler'
    return result
  }
}
