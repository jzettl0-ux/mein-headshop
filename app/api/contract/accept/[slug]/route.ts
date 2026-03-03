import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** POST – Vertrag elektronisch bestätigen (öffentlich, z. B. Verkäufer/Lieferant) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  const admin = createSupabaseAdmin()
  const { data: templateRow, error: fetchError } = await admin
    .from('contract_templates')
    .select('id, template_text')
    .eq('slug', slug)
    .maybeSingle()
  if (fetchError || !templateRow) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Gültige E-Mail-Adresse ist erforderlich' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : null
  const reference_type = typeof body.reference_type === 'string' ? body.reference_type.trim() || null : null
  const reference_id = typeof body.reference_id === 'string' ? body.reference_id.trim() || null : null
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? null
  const user_agent = req.headers.get('user-agent') ?? null
  const { error: insertError } = await admin.from('contract_acceptances').insert({
    contract_slug: slug,
    accepted_by_name: name,
    accepted_by_email: email,
    ip_address: ip,
    user_agent: user_agent,
    reference_type: reference_type || null,
    reference_id: reference_id || null,
    template_snapshot: templateRow.template_text?.slice(0, 50000) ?? null,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Vertrag wurde elektronisch bestätigt.' })
}
