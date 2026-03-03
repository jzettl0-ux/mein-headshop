import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const ENTITY_TYPES = ['product', 'finance_settings', 'order', 'staff', 'customer'] as const
const ACTIONS = ['create', 'update', 'delete'] as const

function escapeLike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

/**
 * GET – Audit-Log (GoBD). Nur Owner – lückenlose Nachvollziehbarkeit.
 * Query: limit, entity_type, action, date_from, date_to, changed_by, search
 */
export async function GET(req: NextRequest) {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const limit = Math.min(200, Math.max(10, parseInt(req.nextUrl.searchParams.get('limit') || '100', 10)))
  const entityType = req.nextUrl.searchParams.get('entity_type')
  const action = req.nextUrl.searchParams.get('action')
  const dateFrom = req.nextUrl.searchParams.get('date_from')
  const dateTo = req.nextUrl.searchParams.get('date_to')
  const changedBy = req.nextUrl.searchParams.get('changed_by')?.trim()
  const search = req.nextUrl.searchParams.get('search')?.trim()

  const admin = createSupabaseAdmin()
  let query = admin
    .from('audit_logs')
    .select('id, entity_type, entity_id, action, field_name, old_value, new_value, changed_by_email, changed_by_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entityType && ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])) {
    query = query.eq('entity_type', entityType)
  }
  if (action && ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    query = query.eq('action', action)
  }
  if (dateFrom) {
    const from = new Date(dateFrom)
    if (!isNaN(from.getTime())) query = query.gte('created_at', from.toISOString())
  }
  if (dateTo) {
    const to = new Date(dateTo)
    if (!isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999)
      query = query.lte('created_at', to.toISOString())
    }
  }
  if (changedBy && changedBy.length >= 1) {
    query = query.ilike('changed_by_email', `%${escapeLike(changedBy)}%`)
  }
  if (search && search.length >= 2) {
    const safe = search.replace(/,/g, '')
    const p = `%${escapeLike(safe)}%`
    query = query.or(`old_value.ilike.${p},new_value.ilike.${p},field_name.ilike.${p}`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
