/**
 * Öffentliche API: verifizierte Eco-Zertifizierungen für ein Produkt (Badge auf PDP)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const CERT_LABELS: Record<string, string> = {
  FSC: 'FSC',
  'EU-BIO': 'EU-Bio',
  GOTS: 'GOTS',
  OEKO_TEX: 'Oeko-Tex',
  B_CORP: 'B Corp',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ certifications: [] })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ certifications: [] })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog')
    .from('eco_certifications')
    .select('certification_type, document_url')
    .eq('product_id', productId)
    .eq('status', 'VERIFIED')

  if (error) {
    return NextResponse.json({ certifications: [] })
  }

  const certifications = (data ?? []).map((c: { certification_type: string; document_url: string }) => ({
    type: c.certification_type,
    label: CERT_LABELS[c.certification_type] ?? c.certification_type,
    document_url: c.document_url,
  }))

  return NextResponse.json({ certifications })
}
