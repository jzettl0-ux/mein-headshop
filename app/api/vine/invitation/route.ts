import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/vine/invitation?token=xxx
 * Holt Einladungsdetails (öffentlich, nur mit Token).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json(null, { status: 404 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json(null, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('cx')
    .from('vine_invitations')
    .select('status, products(name)')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json(null, { status: 404 })
  }

  const products = data.products as { name?: string } | null
  return NextResponse.json({
    status: data.status,
    product_name: products?.name ?? null,
  })
}
