import { NextResponse } from 'next/server'
import { requireVendor } from '@/lib/vendor-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Angebote des Vendors */
export async function GET() {
  const auth = await requireVendor()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createSupabaseAdmin()

  try {
    const { data: offers } = await admin
      .from('vendor_offers')
      .select(`
        id,
        price,
        stock,
        sku,
        is_active,
        products (id, name, slug)
      `)
      .eq('vendor_id', auth.vendorId)
      .order('created_at', { ascending: false })

    return NextResponse.json({ offers: offers ?? [] })
  } catch (e) {
    console.error('[vendor/offers]', e)
    return NextResponse.json({ offers: [] })
  }
}
