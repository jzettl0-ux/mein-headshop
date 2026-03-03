/**
 * Blueprint TEIL 20.6: Platform Choice Badges (nur wenn catalog ASIN existiert)
 * GET: Liste | POST: Neuer Badge (keyword, winning_asin, cvr_percentage, return_rate)
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
    .schema('catalog_automation')
    .from('platform_choice_badges')
    .select('*')
    .order('keyword')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const keyword = String(body.keyword ?? '').trim()
  const winningAsin = String(body.winning_asin ?? '').trim().slice(0, 15)
  const cvr = Number(body.cvr_percentage)
  const returnRate = Number(body.return_rate)
  if (!keyword) return NextResponse.json({ error: 'keyword fehlt' }, { status: 400 })
  if (!winningAsin) return NextResponse.json({ error: 'winning_asin fehlt' }, { status: 400 })
  if (isNaN(cvr) || cvr < 0) return NextResponse.json({ error: 'cvr_percentage ungültig' }, { status: 400 })
  if (isNaN(returnRate) || returnRate < 0) return NextResponse.json({ error: 'return_rate ungültig' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_automation')
    .from('platform_choice_badges')
    .insert({
      keyword,
      winning_asin: winningAsin,
      cvr_percentage: Math.round(cvr * 100) / 100,
      return_rate: Math.round(returnRate * 100) / 100,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
