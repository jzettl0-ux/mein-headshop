/**
 * Transparency Codes – QR-Codes generieren und verwalten
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(12)
  let s = ''
  for (let i = 0; i < 12; i++) s += chars[bytes[i]! % chars.length]
  return s
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const product_id = searchParams.get('product_id')
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('security')
    .from('transparency_codes')
    .select('*, products(id, name, slug)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (product_id) q = q.eq('product_id', product_id)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data ?? [] })
}

/** POST – Batch neue Codes generieren */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { product_id, asin, count } = body
  const cnt = Math.min(Math.max(parseInt(String(count ?? 1), 10) || 1, 1), 100)

  const admin = createSupabaseAdmin()
  const existing = new Set<string>()
  const { data: dupes } = await admin.schema('security').from('transparency_codes').select('unique_qr_code')
  for (const r of dupes ?? []) (r as { unique_qr_code: string }).unique_qr_code && existing.add((r as { unique_qr_code: string }).unique_qr_code)

  const rows: { product_id: string | null; asin: string | null; unique_qr_code: string }[] = []
  while (rows.length < cnt) {
    const code = generateUniqueCode()
    if (!existing.has(code)) {
      existing.add(code)
      rows.push({ product_id: product_id || null, asin: asin?.trim() || null, unique_qr_code: code })
    }
  }

  const { data, error } = await admin
    .schema('security')
    .from('transparency_codes')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generated: rows.length, codes: data ?? [] })
}
