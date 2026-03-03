import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Commission Rules mit Joins */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('commission_rules')
    .select(`
      *,
      product_categories(id, slug, name),
      vendor_accounts(id, company_name)
    `)
    .order('priority', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Neue Commission Rule */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const { rule_name, category_id, vendor_id, percentage_fee, fixed_fee, is_active, priority } = body

  if (!rule_name || typeof rule_name !== 'string' || !rule_name.trim()) {
    return NextResponse.json({ error: 'rule_name erforderlich' }, { status: 400 })
  }
  const pct = parseFloat(String(percentage_fee ?? 15).replace(',', '.'))
  if (isNaN(pct) || pct < 0 || pct > 100) {
    return NextResponse.json({ error: 'percentage_fee muss 0–100 sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const payload = {
    rule_name: String(rule_name).trim(),
    category_id: category_id || null,
    vendor_id: vendor_id || null,
    percentage_fee: pct,
    fixed_fee: parseFloat(String(fixed_fee ?? 0).replace(',', '.')) || 0,
    is_active: is_active !== false,
    priority: typeof priority === 'number' ? priority : parseInt(String(priority ?? 10), 10) || 10,
  }

  const { data, error } = await admin
    .from('commission_rules')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
