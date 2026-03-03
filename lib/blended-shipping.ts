/**
 * Blueprint Teil 7.20: Blended Shipping Rate
 * Mischkalkulation für Multi-Vendor-Warenkorb – Kunde zahlt festen Betrag.
 */
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export async function getBlendedShippingFee(vendorCount: number): Promise<number | null> {
  if (!hasSupabaseAdmin() || vendorCount < 1) return null
  const admin = createSupabaseAdmin()
  const { data } = await admin
    .schema('advanced_financials')
    .from('blended_shipping_rules')
    .select('customer_shipping_fee, vendor_subsidy_percentage')
    .eq('cart_vendor_count', Math.min(vendorCount, 10))
    .eq('is_active', true)
    .order('cart_vendor_count', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return Number((data as { customer_shipping_fee: number }).customer_shipping_fee ?? 0)
}
