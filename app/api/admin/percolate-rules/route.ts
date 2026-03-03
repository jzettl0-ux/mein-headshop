import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_defense')
    .from('percolate_rules')
    .select('*')
    .order('illegal_keyword')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const keyword = typeof body.illegal_keyword === 'string' ? body.illegal_keyword.trim() : ''
  const action = ['BLOCK', 'FLAG_FOR_REVIEW'].includes(body.action) ? body.action : 'BLOCK'
  const categoryId = body.category_context || null
  if (!keyword) return NextResponse.json({ error: 'illegal_keyword erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_defense')
    .from('percolate_rules')
    .insert({ illegal_keyword: keyword, action, category_context: categoryId })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
