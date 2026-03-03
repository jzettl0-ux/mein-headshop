/**
 * Blueprint TEIL 20.2: Virtual Bundle Components – POST (hinzufügen)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const bundleAsin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!bundleAsin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const componentAsin = String(body.component_asin ?? '').trim().slice(0, 15)
  const qty = Math.max(1, Math.floor(Number(body.quantity_required) ?? 1))
  if (!componentAsin) return NextResponse.json({ error: 'component_asin fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_automation')
    .from('virtual_bundle_components')
    .insert({ bundle_asin: bundleAsin, component_asin: componentAsin, quantity_required: qty })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
