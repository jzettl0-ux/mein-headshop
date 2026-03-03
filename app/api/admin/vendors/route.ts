import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendVendorWelcomeEmail } from '@/lib/send-vendor-email'
import { getVendorRegistrationLink } from '@/lib/vendor-invite-link'

export const dynamic = 'force-dynamic'

/** GET – Liste aller Vendors */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('vendor_accounts')
    .select(`
      id,
      company_name,
      legal_form,
      vat_id,
      contact_email,
      contact_person,
      kyb_status,
      kyb_approved_at,
      is_active,
      created_at
    `)
    .order('company_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Vendor anlegen */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const companyName = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const contactEmail = typeof body.contact_email === 'string' ? body.contact_email.trim() : ''
  if (!companyName || !contactEmail) {
    return NextResponse.json({ error: 'company_name und contact_email sind erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('vendor_accounts')
    .insert({
      company_name: companyName,
      legal_form: body.legal_form?.trim() || null,
      registration_number: body.registration_number?.trim() || null,
      vat_id: body.vat_id?.trim() || null,
      tax_number: body.tax_number?.trim() || null,
      address_street: body.address_street?.trim() || null,
      address_zip: body.address_zip?.trim() || null,
      address_city: body.address_city?.trim() || null,
      address_country: body.address_country?.trim() || 'DE',
      contact_email: contactEmail,
      contact_phone: body.contact_phone?.trim() || null,
      contact_person: body.contact_person?.trim() || null,
      kyb_status: body.kyb_status || 'draft',
      bank_iban: body.bank_iban?.trim() || null,
      bank_bic: body.bank_bic?.trim() || null,
      bank_holder: body.bank_holder?.trim() || null,
      notes: body.notes?.trim() || null,
      is_active: body.is_active !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sendWelcome = typeof body.send_welcome_email !== 'boolean' || body.send_welcome_email
  if (sendWelcome) {
    const { actionLink, userId } = await getVendorRegistrationLink(data.contact_email)
    if (userId) {
      await admin.from('vendor_accounts').update({ user_id: userId, updated_at: new Date().toISOString() }).eq('id', data.id)
    }
    const emailResult = await sendVendorWelcomeEmail(data.contact_email, {
      companyName: data.company_name,
      contactPerson: data.contact_person || undefined,
      registrationLink: actionLink ?? undefined,
    })
    if (!emailResult.ok) console.warn('[vendors] Welcome email failed:', emailResult.error)
  }

  return NextResponse.json(data)
}
