import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – alle Vertragsvorlagen */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('contract_templates')
    .select('id, slug, label, template_text, contract_type, created_at, updated_at')
    .order('label')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – neue Vertragsvorlage anlegen */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase().replace(/\s+/g, '-') : ''
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const template_text = typeof body.template_text === 'string' ? body.template_text : ''
  const contract_type = typeof body.contract_type === 'string' && ['employee', 'vendor', 'other', ''].includes(body.contract_type) ? (body.contract_type || null) : null
  if (!slug || !label) return NextResponse.json({ error: 'slug und label sind erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('contract_templates')
    .insert({ slug, label, template_text, contract_type: contract_type || null })
    .select('id, slug, label, template_text, contract_type, created_at, updated_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
