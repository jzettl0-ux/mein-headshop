/**
 * Blueprint TEIL 20.1: Small & Light – Routing Rules (Briefversand)
 * GET: Liste | POST: Neue Regel
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('logistics_optimization')
    .from('routing_rules')
    .select('*')
    .order('max_price_value', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const maxWeight = Math.max(0, Math.floor(Number(body.max_weight_grams) ?? 500))
  const maxThickness = Math.max(0, Math.floor(Number(body.max_thickness_mm) ?? 30))
  const maxPrice = Number(body.max_price_value)
  if (isNaN(maxPrice) || maxPrice < 0)
    return NextResponse.json({ error: 'max_price_value ungültig' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('logistics_optimization')
    .from('routing_rules')
    .insert({
      max_weight_grams: maxWeight,
      max_thickness_mm: maxThickness,
      max_price_value: Math.round(maxPrice * 100) / 100,
      assigned_shipping_method: body.assigned_shipping_method ?? 'LETTER_TRACKED',
      is_active: body.is_active !== false,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
