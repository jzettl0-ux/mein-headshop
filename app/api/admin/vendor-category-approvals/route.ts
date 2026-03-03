import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Vendor Category Approvals (optional ?status=PENDING) */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('admin')
    .from('vendor_category_approvals')
    .select(`
      *,
      vendor_accounts(company_name, contact_email),
      product_categories(id, slug, name)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter && ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'].includes(statusFilter)) {
    q = q.eq('status', statusFilter) as typeof q
  }

  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
