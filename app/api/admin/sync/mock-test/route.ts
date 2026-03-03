import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { MockInfluencerConnector } from '@/lib/connectors/mock-influencer'

export const dynamic = 'force-dynamic'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'produkt'
}

/**
 * POST – Mock-Schnittstelle testen: MockInfluencerConnector ausführen und in products upserten.
 * Bei existierendem Produkt (external_id + integration_id null) nur Preis und Bestand aktualisieren.
 */
export async function POST() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const connector = new MockInfluencerConnector()
  let products: { externalId: string; name: string; price: number; stock: number; image_url?: string }[]
  try {
    products = await connector.fetchProducts()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Connector-Abruf fehlgeschlagen'
    return NextResponse.json({ success: false, message, created: 0, updated: 0 })
  }

  const admin = createSupabaseAdmin()
  let created = 0
  let updated = 0
  const category = 'zubehoer'

  for (const p of products) {
    const { data: existing } = await admin
      .from('products')
      .select('id')
      .eq('external_id', p.externalId)
      .is('integration_id', null)
      .maybeSingle()

    if (existing) {
      const { error } = await admin
        .from('products')
        .update({
          price: p.price,
          stock: p.stock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (error) return NextResponse.json({ success: false, message: error.message, created, updated })
      updated++
    } else {
      const baseSlug = slugify(p.name)
      const slug = `${baseSlug}-mock-${p.externalId.slice(0, 12).replace(/[^a-z0-9-]/gi, '')}`
      const { error } = await admin.from('products').insert({
        name: p.name,
        slug,
        description: null,
        price: p.price,
        stock: p.stock,
        image_url: p.image_url ?? null,
        category,
        external_id: p.externalId,
        integration_id: null,
        supplier_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) return NextResponse.json({ success: false, message: error.message, created, updated })
      created++
    }
  }

  return NextResponse.json({
    success: true,
    message: `${created} angelegt, ${updated} aktualisiert (nur Preis/Bestand).`,
    created,
    updated,
  })
}
