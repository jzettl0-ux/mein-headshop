import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Gated Categories mit Kategorie-Details */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('admin')
    .from('gated_categories')
    .select('*, product_categories(id, slug, name)')
    .order('created_at', { ascending: false })

  const withTier = (data ?? []).map((r) => ({
    ...r,
    min_loyalty_tier_required: Number((r as { min_loyalty_tier_required?: number }).min_loyalty_tier_required) || 1,
  }))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(withTier)
}

/** POST – Neue Gated Category */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const { category_id, requires_approval, required_document_types } = body

  if (!category_id) return NextResponse.json({ error: 'category_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const payload = {
    category_id,
    requires_approval: requires_approval !== false,
    required_document_types: Array.isArray(required_document_types) ? required_document_types : null,
  }

  const { data, error } = await admin
    .schema('admin')
    .from('gated_categories')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kategorie ist bereits gated' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
