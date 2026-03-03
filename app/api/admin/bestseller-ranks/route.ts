/**
 * Blueprint TEIL 20.6: Bestseller Ranks (nur wenn catalog + admin.gated_categories existieren)
 * GET: Liste | POST: Eintrag (asin, category_id, calculated_bsr_score, current_rank_position)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('category_id')
  const admin = createSupabaseAdmin()
  let q = admin.schema('catalog_automation').from('bestseller_ranks').select('*').order('current_rank_position', { ascending: true, nullsFirst: false })
  if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const asin = String(body.asin ?? '').trim().slice(0, 15)
  const categoryId = body.category_id
  if (!asin || !categoryId) return NextResponse.json({ error: 'asin und category_id erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_automation')
    .from('bestseller_ranks')
    .insert({
      asin,
      category_id: categoryId,
      calculated_bsr_score: Math.max(0, Number(body.calculated_bsr_score) ?? 0),
      current_rank_position: body.current_rank_position != null ? Math.max(0, Math.floor(Number(body.current_rank_position))) : null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
