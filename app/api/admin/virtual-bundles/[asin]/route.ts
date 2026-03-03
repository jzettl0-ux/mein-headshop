/**
 * Blueprint TEIL 20.2: Virtual Bundle GET/PATCH/DELETE (asin = bundle_asin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const asin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: bundle, error: eBundle } = await admin.schema('catalog_automation').from('virtual_bundles').select('*').eq('bundle_asin', asin).single()
  if (eBundle || !bundle) return NextResponse.json({ error: 'Bundle nicht gefunden' }, { status: 404 })
  const { data: components } = await admin.schema('catalog_automation').from('virtual_bundle_components').select('*').eq('bundle_asin', asin)
  return NextResponse.json({ ...bundle, components: components ?? [] })
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const asin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.bundle_title === 'string' && body.bundle_title.trim()) updates.bundle_title = body.bundle_title.trim()
  if (typeof body.bundle_price === 'number' && body.bundle_price >= 0) updates.bundle_price = Math.round(body.bundle_price * 100) / 100
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('catalog_automation').from('virtual_bundles').update(updates).eq('bundle_asin', asin).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const asin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('catalog_automation').from('virtual_bundles').delete().eq('bundle_asin', asin)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
