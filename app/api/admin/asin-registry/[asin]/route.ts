import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** DELETE – ASIN aus Registry entfernen */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const asin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!/^[A-Z0-9]{8,15}$/.test(asin)) {
    return NextResponse.json({ error: 'Ungültiger ASIN' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .schema('catalog')
    .from('amazon_standard_identification_numbers')
    .delete()
    .eq('asin', asin)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
