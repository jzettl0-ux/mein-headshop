/**
 * Admin: Vendor-Anfrage bearbeiten – Genehmigen (Vendor anlegen + E-Mail) oder Ablehnen (E-Mail)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendVendorWelcomeEmail, sendVendorRejectionEmail } from '@/lib/send-vendor-email'
import { getVendorRegistrationLink } from '@/lib/vendor-invite-link'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin, user } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const action = body.action
  const rejectionReason = typeof body.rejection_reason === 'string' ? body.rejection_reason.trim().slice(0, 500) : ''

  const admin = createSupabaseAdmin()

  const { data: inquiry, error: fetchErr } = await admin
    .from('vendor_inquiries')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !inquiry) {
    return NextResponse.json({ error: 'Anfrage nicht gefunden' }, { status: 404 })
  }

  if (inquiry.status !== 'pending') {
    return NextResponse.json({ error: 'Anfrage wurde bereits bearbeitet' }, { status: 400 })
  }

  if (action === 'approve') {
    const { data: vendor, error: insertErr } = await admin
      .from('vendor_accounts')
      .insert({
        company_name: inquiry.company_name,
        legal_form: inquiry.legal_form || null,
        registration_number: inquiry.registration_number || null,
        vat_id: inquiry.vat_id || null,
        tax_number: inquiry.tax_number || null,
        address_street: inquiry.address_street || null,
        address_zip: inquiry.address_zip || null,
        address_city: inquiry.address_city || null,
        address_country: inquiry.address_country || 'DE',
        contact_email: inquiry.contact_email,
        contact_phone: inquiry.contact_phone || null,
        contact_person: inquiry.contact_person || null,
        kyb_status: 'submitted',
        notes: [
          inquiry.partner_type === 'influencer' ? 'Partner-Typ: Influencer' : 'Partner-Typ: Firma',
          inquiry.influencer_links && typeof inquiry.influencer_links === 'object' && Object.keys(inquiry.influencer_links).length > 0
            ? 'Influencer-Links: ' + Object.entries(inquiry.influencer_links).map(([k, v]) => `${k}: ${v}`).join(' | ')
            : null,
          inquiry.message,
          inquiry.product_interest,
        ].filter(Boolean).join('\n\n') || null,
        is_active: true,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[vendor-inquiry] approve insert:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    await admin
      .from('vendor_inquiries')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id || null,
        vendor_id: vendor.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // BFSG: vendor_legal_flags anlegen (Kleinstunternehmen-Ausnahme)
    const bfsgExempt = inquiry.bfsg_micro_enterprise_exemption === true
    await admin.schema('compliance').from('vendor_legal_flags').upsert(
      { vendor_id: vendor.id, bfsg_micro_enterprise_exemption: bfsgExempt, updated_at: new Date().toISOString() },
      { onConflict: 'vendor_id' }
    )

    const { actionLink, userId } = await getVendorRegistrationLink(inquiry.contact_email)
    if (userId) {
      await admin.from('vendor_accounts').update({ user_id: userId, updated_at: new Date().toISOString() }).eq('id', vendor.id)
    }

    const emailResult = await sendVendorWelcomeEmail(inquiry.contact_email, {
      companyName: inquiry.company_name,
      contactPerson: inquiry.contact_person || undefined,
      registrationLink: actionLink ?? undefined,
    })
    if (!emailResult.ok) {
      console.warn('[vendor-inquiry] Welcome email failed:', emailResult.error)
    }

    return NextResponse.json({ vendor, email_sent: emailResult.ok })
  }

  if (action === 'reject') {
    await admin
      .from('vendor_inquiries')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    const emailResult = await sendVendorRejectionEmail(inquiry.contact_email, {
      companyName: inquiry.company_name,
      contactPerson: inquiry.contact_person || undefined,
      rejectionReason: rejectionReason || undefined,
    })
    if (!emailResult.ok) {
      console.warn('[vendor-inquiry] Rejection email failed:', emailResult.error)
    }

    return NextResponse.json({ success: true, email_sent: emailResult.ok })
  }

  return NextResponse.json({ error: 'Ungültige Aktion (approve oder reject)' }, { status: 400 })
}
