/**
 * GET – Admin: UGC-Posts für Moderation
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('community')
      .from('ugc_posts')
      .select('post_id, image_url, caption, status, likes_count, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[admin/ugc]', error.message)
      return NextResponse.json([])
    }
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[admin/ugc]', e)
    return NextResponse.json([])
  }
}
