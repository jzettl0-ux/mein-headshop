import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** POST – UBO hinzufügen */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: vendorId } = await params
  if (!vendorId) return NextResponse.json({ error: 'Vendor-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : ''
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : ''
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'first_name und last_name sind erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('vendor_ubos')
    .insert({
      vendor_id: vendorId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: body.date_of_birth?.trim() || null,
      nationality: body.nationality?.trim() || null,
      role: body.role?.trim() || null,
      share_percent: body.share_percent != null ? Number(body.share_percent) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
