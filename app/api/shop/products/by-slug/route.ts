/**
 * GET – Produkt per Slug (öffentlich, minimal für Trade-In etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json(null, { status: 404 })

  if (!hasSupabaseAdmin()) return NextResponse.json(null, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('products')
    .select('id, name, slug, price')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(data)
}
