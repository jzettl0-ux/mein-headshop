/**
 * Blueprint 2.5: Eco-Zertifizierungen
 * PATCH – Verify / Reject
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  const body = await req.json().catch(() => ({}))
  const { status } = body

  if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'status muss VERIFIED oder REJECTED sein' }, { status: 400 })
  }

  const { user } = await getAdminContext()
  const adminId = user?.id ?? null

  const admin = createSupabaseAdmin()

  const { data, error } = await admin
    .schema('catalog')
    .from('eco_certifications')
    .update({
      status,
      verified_by_admin: adminId,
      verified_at: new Date().toISOString(),
    })
    .eq('cert_id', id)
    .select()
    .single()

  if (error) {
    console.error('[admin/eco-certifications] PATCH', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}
