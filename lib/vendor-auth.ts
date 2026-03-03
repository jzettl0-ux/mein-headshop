/**
 * Vendor-Portal Auth – Prüft ob eingeloggter User ein gültiger Vendor ist.
 * Nutzt vendor_accounts.user_id + kyb_status, is_active.
 */

import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export interface VendorContext {
  user: { id: string; email: string } | null
  vendor: {
    id: string
    company_name: string
    contact_email: string
    kyb_status: string
    is_active: boolean
  } | null
  isVendor: boolean
}

/**
 * Liefert den Vendor-Kontext für die aktuelle Session.
 * isVendor = true nur wenn: User eingeloggt + vendor_accounts.user_id gesetzt + kyb_status=approved + is_active=true
 */
export async function getVendorContext(): Promise<VendorContext> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { user: null, vendor: null, isVendor: false }
  }

  if (!hasSupabaseAdmin()) {
    return { user: { id: user.id, email: user.email }, vendor: null, isVendor: false }
  }

  const admin = createSupabaseAdmin()
  const { data: vendor } = await admin
    .from('vendor_accounts')
    .select('id, company_name, contact_email, kyb_status, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!vendor || vendor.kyb_status !== 'approved' || vendor.is_active !== true) {
    return { user: { id: user.id, email: user.email }, vendor: null, isVendor: false }
  }

  return {
    user: { id: user.id, email: user.email },
    vendor: {
      id: vendor.id,
      company_name: vendor.company_name,
      contact_email: vendor.contact_email,
      kyb_status: vendor.kyb_status,
      is_active: vendor.is_active,
    },
    isVendor: true,
  }
}

/**
 * Für API-Routes: Gibt { ok, vendorId?, error?, status } zurück.
 */
export async function requireVendor(): Promise<
  { ok: true; vendorId: string; vendor: NonNullable<VendorContext['vendor']> } | { ok: false; error: string; status: number }
> {
  const ctx = await getVendorContext()
  if (!ctx.user) {
    return { ok: false, error: 'Nicht angemeldet', status: 401 }
  }
  if (!ctx.isVendor || !ctx.vendor) {
    return { ok: false, error: 'Kein Vendor-Zugriff', status: 403 }
  }
  return { ok: true, vendorId: ctx.vendor.id, vendor: ctx.vendor }
}
