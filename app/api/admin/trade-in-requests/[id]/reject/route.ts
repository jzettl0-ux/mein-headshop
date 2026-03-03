/**
 * POST – Trade-In ablehnen
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('recommerce')
    .from('trade_in_requests')
    .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
    .eq('trade_in_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
