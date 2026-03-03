import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const LEGAL_SLUGS = ['impressum', 'privacy', 'terms', 'returns'] as const

export const dynamic = 'force-dynamic'

/** GET – einen Rechtstext (Admin) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  if (!LEGAL_SLUGS.includes(slug as any)) return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('legal_texts')
    .select('slug, title, content, updated_at')
    .eq('slug', slug)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

/** PATCH – Rechtstext aktualisieren (Admin) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  if (!LEGAL_SLUGS.includes(slug as any)) return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: { title?: string; content?: string } = {}
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (typeof body.content === 'string') updates.content = body.content
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('legal_texts')
    .update(updates)
    .eq('slug', slug)
    .select('slug, title, content, updated_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
