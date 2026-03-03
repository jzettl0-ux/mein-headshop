import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** PATCH – B2B-Konto freigeben/ablehnen */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : null
  if (!status) return NextResponse.json({ error: 'status (approved/rejected) erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...(status === 'rejected' && { rejected_reason: typeof body.rejected_reason === 'string' ? body.rejected_reason.slice(0, 500) : null }),
  }

  const { data, error } = await admin
    .schema('b2b')
    .from('business_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
