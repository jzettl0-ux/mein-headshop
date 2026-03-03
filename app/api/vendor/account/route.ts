import { NextResponse } from 'next/server'
import { requireVendor } from '@/lib/vendor-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Stammdaten des Vendors (read-only) */
export async function GET() {
  const auth = await requireVendor()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createSupabaseAdmin()

  const { data, error } = await admin
    .from('vendor_accounts')
    .select('id, company_name, legal_form, vat_id, address_street, address_zip, address_city, address_country, contact_email, contact_phone, contact_person')
    .eq('id', auth.vendorId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Konto nicht gefunden' }, { status: 404 })

  return NextResponse.json(data)
}
