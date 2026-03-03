import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – alle Rechtstexte (Slug, Titel, ob Inhalt gesetzt) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('legal_texts')
    .select('slug, title, content, updated_at')
    .order('slug')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (data ?? []).map((row) => ({
    slug: row.slug,
    title: row.title,
    has_content: Boolean(typeof row.content === 'string' && row.content.trim()),
    updated_at: row.updated_at,
  }))
  return NextResponse.json(list)
}
