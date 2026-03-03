import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Vendor-Detail inkl. UBOs, Dokumente, Angebote */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()

  const { data: vendor, error: vendorError } = await admin
    .from('vendor_accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (vendorError || !vendor) {
    return NextResponse.json({ error: 'Vendor nicht gefunden' }, { status: 404 })
  }

  const [{ data: ubos }, { data: documents }, { data: offers }, { data: legalFlags }] = await Promise.all([
    admin.from('vendor_ubos').select('*').eq('vendor_id', id).order('created_at'),
    admin.from('vendor_kyb_documents').select('*').eq('vendor_id', id).order('created_at'),
    admin.from('vendor_offers').select('*, products(id, name, slug, price)').eq('vendor_id', id).order('created_at'),
    admin.schema('compliance').from('vendor_legal_flags').select('*').eq('vendor_id', id).maybeSingle(),
  ])

  return NextResponse.json({
    ...vendor,
    ubos: ubos ?? [],
    documents: documents ?? [],
    offers: offers ?? [],
    legal_flags: legalFlags ?? null,
  })
}

/** PATCH – Vendor aktualisieren (inkl. KYB-Status) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin, user } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  const allowed = [
    'company_name', 'legal_form', 'registration_number', 'vat_id', 'tax_number',
    'address_street', 'address_zip', 'address_city', 'address_country',
    'contact_email', 'contact_phone', 'contact_person',
    'kyb_status', 'kyb_rejection_reason', 'kyb_approved_at', 'kyb_approved_by',
    'bank_iban', 'bank_bic', 'bank_holder', 'notes', 'is_active',
    'mollie_organization_id', 'bfsg_micro_enterprise_exemption',
  ]
  for (const key of allowed) {
    if (key in body) {
      const v = body[key]
      if (key === 'kyb_approved_at') updates[key] = v ? new Date(v).toISOString() : null
      else if (key === 'kyb_approved_by') updates[key] = v || null
      else if (typeof v === 'string') updates[key] = v.trim() || null
      else if (typeof v === 'boolean') updates[key] = v
      else if (v != null) updates[key] = v
    }
  }

  if (body.kyb_status === 'approved') {
    updates.kyb_approved_at = new Date().toISOString()
    updates.kyb_approved_by = user?.id ?? null
  }
  if (body.kyb_status === 'rejected' && body.kyb_rejection_reason) {
    updates.kyb_rejection_reason = String(body.kyb_rejection_reason).trim()
  }

  const bfsgExempt = body.bfsg_micro_enterprise_exemption
  if (typeof bfsgExempt === 'boolean') {
    delete (updates as Record<string, unknown>).bfsg_micro_enterprise_exemption
  }

  if (Object.keys(updates).length === 0 && typeof bfsgExempt !== 'boolean') {
    return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  if (Object.keys(updates).length > 0) {
    const { data, error } = await admin
      .from('vendor_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (typeof bfsgExempt === 'boolean') {
    await admin.schema('compliance').from('vendor_legal_flags').upsert(
      { vendor_id: id, bfsg_micro_enterprise_exemption: bfsgExempt, updated_at: new Date().toISOString() },
      { onConflict: 'vendor_id' }
    )
  }

  const { data, error } = await admin.from('vendor_accounts').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: flags } = await admin.schema('compliance').from('vendor_legal_flags').select('*').eq('vendor_id', id).maybeSingle()
  return NextResponse.json({ ...data, legal_flags: flags ?? null })
}

/** DELETE – Vendor löschen (Cascade auf UBOs, Dokumente, Offers) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('vendor_accounts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
