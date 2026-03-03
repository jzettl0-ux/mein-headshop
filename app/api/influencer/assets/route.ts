import { NextRequest, NextResponse } from 'next/server'
import { getInfluencerContext } from '@/lib/influencer-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'influencer-assets'

/** GET – Galerie für Influencer: Filter nach category, nur sichtbare Assets mit Public-URL */
export async function GET(req: NextRequest) {
  const { isInfluencer } = await getInfluencerContext()
  if (!isInfluencer) {
    return NextResponse.json({ error: 'Nur für Partner sichtbar' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const admin = createSupabaseAdmin()
  let query = admin
    .from('influencer_assets')
    .select('id, title, category, storage_path, format_info, width, height, created_at')
    .in('visibility', ['public', 'partner_only'])
    .order('created_at', { ascending: false })

  if (category && ['product_photos', 'banner', 'logos'].includes(category)) {
    query = query.eq('category', category)
  }

  const { data: rows, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucketPath = baseUrl ? `${baseUrl}/storage/v1/object/public/${BUCKET}/` : ''

  const assets = (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    format_info: r.format_info ?? null,
    width: r.width ?? null,
    height: r.height ?? null,
    created_at: r.created_at,
    url: bucketPath + (r.storage_path || ''),
    download_url: bucketPath + (r.storage_path || ''),
  }))

  return NextResponse.json({ assets })
}
