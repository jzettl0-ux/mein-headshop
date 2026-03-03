import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** POST – Admin: Startseiten-Felder mehrerer Influencer speichern */
export async function POST(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const body = await req.json()
    const updates = Array.isArray(body.updates) ? body.updates : []
    if (updates.length === 0) {
      return NextResponse.json({ ok: true })
    }

    for (const row of updates) {
      const id = row.id
      if (!id) continue
      await supabase
        .from('influencers')
        .update({
          show_on_homepage: row.show_on_homepage ?? false,
          homepage_order: row.homepage_order ?? 0,
          homepage_title: (row.homepage_title ?? '').trim() || null,
          homepage_bio: (row.homepage_bio ?? '').trim() || null,
        })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin influencers-homepage POST:', e)
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 500 })
  }
}
