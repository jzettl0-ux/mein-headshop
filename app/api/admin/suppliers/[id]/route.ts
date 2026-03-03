import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Ein Lieferant (für Detailseite) */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('suppliers').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Lieferant nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

/** PATCH – Lieferant aktualisieren. Body: name?, email?, api_endpoint?, api_key?, type?, vat_id?, bank_*, shipping_provider?, api_headers? */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (body.email !== undefined) updates.contact_email = body.email?.trim() || null
  if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone?.trim() || null
  if (body.contact_person !== undefined) updates.contact_person = body.contact_person?.trim() || null
  if (body.order_email !== undefined) updates.order_email = body.order_email?.trim() || null
  if (body.website !== undefined) updates.website = body.website?.trim() || null
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null
  if (body.minimum_order_value !== undefined) updates.minimum_order_value = body.minimum_order_value != null ? Number(body.minimum_order_value) : null
  if (body.payment_terms !== undefined) updates.payment_terms = body.payment_terms?.trim() || null
  if (body.vat_id !== undefined) updates.vat_id = body.vat_id?.trim() || null
  if (body.bank_iban !== undefined) updates.bank_iban = body.bank_iban?.trim() || null
  if (body.bank_bic !== undefined) updates.bank_bic = body.bank_bic?.trim() || null
  if (body.bank_holder !== undefined) updates.bank_holder = body.bank_holder?.trim() || null
  if (body.shipping_provider !== undefined) updates.shipping_provider = body.shipping_provider?.trim() || null
  if (body.api_headers !== undefined) updates.api_headers = typeof body.api_headers === 'object' && body.api_headers !== null ? body.api_headers : (typeof body.api_headers === 'string' ? (() => { try { return JSON.parse(body.api_headers) } catch { return {} } })() : {})
  if (body.api_endpoint !== undefined) updates.api_endpoint = body.api_endpoint?.trim() || null
  if (body.api_key !== undefined) updates.api_key = body.api_key?.trim() || null
  if (body.type === 'api' || body.type === 'email' || body.type === 'manual') {
    updates.type = body.type
    updates.api_capable = body.type === 'api'
    updates.connector_type = body.type === 'api' ? 'mock_influencer' : null
  }
  updates.updated_at = new Date().toISOString()

  if (Object.keys(updates).length <= 1) return NextResponse.json({ error: 'Keine Felder zum Aktualisieren' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('suppliers').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Lieferant löschen */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('suppliers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
