/**
 * Öffentliche API: Produkt-IDs mit verifizierter Eco-Zertifizierung
 * Für Shop-Filter "Nur nachhaltige Produkte" (Blueprint 2.5)
 */

import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ productIds: [] })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog')
    .from('eco_certifications')
    .select('product_id')
    .eq('status', 'VERIFIED')
    .not('product_id', 'is', null)

  if (error) {
    return NextResponse.json({ productIds: [] })
  }

  const productIds = [...new Set((data ?? []).map((r: { product_id: string }) => r.product_id).filter(Boolean))]
  return NextResponse.json({ productIds })
}
