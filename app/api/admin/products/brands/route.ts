import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessProducts } from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Einzigartige Marken/Hersteller aus allen Produkten (für Admin-Dropdown). */
export async function GET() {
  const { isAdmin, roles } = await getAdminContext()
  if (!isAdmin || !canAccessProducts(roles?.length ? roles : [])) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('products')
    .select('brand')
    .not('brand', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const brands = [...new Set((data ?? []).map((r) => (r.brand || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  return NextResponse.json(brands)
}
