import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/shoppable-videos?product_id=...
 * Öffentlich: Freigegebene Shoppable Videos für ein Produkt.
 */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const productId = request.nextUrl.searchParams.get('product_id')
  if (!productId) {
    return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: videos, error } = await admin
    .schema('catalog')
    .from('shoppable_videos')
    .select('id, title, description, storage_path, duration_seconds')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (videos ?? []).map((v: any) => {
    const url = v.storage_path
      ? admin.storage.from('shoppable-videos').getPublicUrl(v.storage_path).data.publicUrl
      : null
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      url,
      duration_seconds: v.duration_seconds,
    }
  })

  return NextResponse.json(items)
}
