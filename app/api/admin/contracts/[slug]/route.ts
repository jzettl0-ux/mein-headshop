import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – eine Vertragsvorlage */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('contract_templates')
    .select('id, slug, label, template_text, contract_type, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

/** PATCH – Vertragsvorlage aktualisieren */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  const body = await req.json().catch(() => ({}))
  const updates: { label?: string; template_text?: string; contract_type?: string | null } = {}
  if (typeof body.label === 'string') updates.label = body.label.trim()
  if (typeof body.template_text === 'string') updates.template_text = body.template_text
  if (body.contract_type !== undefined) updates.contract_type = body.contract_type === '' || body.contract_type === null ? null : body.contract_type
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('contract_templates')
    .update(updates)
    .eq('slug', slug)
    .select('id, slug, label, template_text, contract_type, created_at, updated_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Vertragsvorlage löschen */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('contract_templates').delete().eq('slug', slug)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
