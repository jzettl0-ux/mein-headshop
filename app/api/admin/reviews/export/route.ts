import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** GET – Admin: alle Bewertungen als CSV für Google Sheets / Auswertung */
export async function GET() {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const { data: rows, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, order_item_id, rating, comment, is_private, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const productIds = [...new Set((rows ?? []).map((r) => r.product_id))]
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    const productMap = new Map((products ?? []).map((p) => [p.id, p]))

    const header = 'Produkt;Produkt-ID;Bewertung;Kommentar;Privat;Datum'
    const csvRows = (rows ?? []).map((r) => {
      const name = productMap.get(r.product_id)?.name ?? ''
      const safeName = name.replace(/;/g, ',').replace(/\n/g, ' ')
      const safeComment = (r.comment ?? '').replace(/;/g, ',').replace(/\n/g, ' ')
      const date = new Date(r.created_at).toLocaleString('de-DE')
      return `${safeName};${r.product_id};${r.rating};${safeComment};${r.is_private ? 'Ja' : 'Nein'};${date}`
    })
    const csv = '\uFEFF' + header + '\n' + csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bewertungen-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    console.error('admin reviews export:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
