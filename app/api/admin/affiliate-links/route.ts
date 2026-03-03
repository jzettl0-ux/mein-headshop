import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/affiliate-links
 * Liste aller Affiliate-Links.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('affiliate_links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/**
 * POST /api/admin/affiliate-links
 * Neuen Affiliate-Link anlegen.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { code, partner_name, partner_email, commission_percent, cookie_days, is_active } = body
  const codeStr = typeof code === 'string' ? code.trim().toUpperCase() : ''
  const nameStr = typeof partner_name === 'string' ? partner_name.trim() : ''
  if (!codeStr || !nameStr) {
    return NextResponse.json({ error: 'code und partner_name erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin
    .schema('advanced_ops')
    .from('affiliate_links')
    .select('id')
    .eq('code', codeStr)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `Code "${codeStr}" existiert bereits` }, { status: 409 })
  }

  const payload = {
    code: codeStr,
    partner_name: nameStr,
    partner_email: typeof partner_email === 'string' && partner_email.trim() ? partner_email.trim() : null,
    commission_percent: typeof commission_percent === 'number' ? commission_percent : parseFloat(String(commission_percent || 5).replace(',', '.')) || 5,
    cookie_days: Math.max(1, Math.min(365, Number(cookie_days) || 30)),
    is_active: is_active !== false,
  }

  const { data, error } = await admin
    .schema('advanced_ops')
    .from('affiliate_links')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
