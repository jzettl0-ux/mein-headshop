import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { OWNER_EMAIL } from '@/lib/owner-email'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { logEntityChanges, writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['employee', 'support', 'product_care', 'admin', 'chef', 'owner', 'hr', 'team_leader', 'warehouse_lead', 'marketing'] as const

function parseRoles(bodyRoles: unknown): string[] | null {
  if (!bodyRoles) return null
  if (Array.isArray(bodyRoles)) {
    const list = bodyRoles.filter((r) => typeof r === 'string' && ALLOWED_ROLES.includes(r as any))
    return list.length ? list : null
  }
  if (typeof bodyRoles === 'string' && ALLOWED_ROLES.includes(bodyRoles as any)) return [bodyRoles]
  return null
}

const PROFILE_KEYS = [
  'first_name', 'last_name', 'date_of_birth', 'place_of_birth', 'country_of_birth', 'nationality',
  'address_street', 'address_postal_code', 'address_city', 'tax_id', 'social_insurance_number',
  'health_insurance', 'phone', 'notes', 'terminated_at', 'contract_ends_at',
] as const

/**
 * PATCH – Rollen, is_active, Profilfelder, Kündigung (nur Owner/Chef).
 * Body: { roles?, is_active?, first_name?, last_name?, date_of_birth?, ... terminated_at? }
 * terminated_at = ISO-Datum → Kündigung (is_active wird false). terminated_at = null → Wiedereinstellung (is_active true).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isStaffManager, isOwner, staff: actor } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber, Chef oder Personal (HR) können Mitarbeiter bearbeiten.' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: targetStaff } = await admin.from('staff').select('email').eq('id', id).single()
  const isOwnerAccount = targetStaff?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
  if (isOwnerAccount && !isOwner) {
    return NextResponse.json({ error: 'Das Inhaber-Konto darf nur vom Inhaber selbst geändert werden.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const newRoles = parseRoles(body.roles ?? body.role)
  // HR darf keine Rollen "owner" oder "chef" vergeben (nur Inhaber/Chef)
  const actorRoles = actor?.roles ?? []
  const isHrOnly = actorRoles.includes('hr') && !actorRoles.includes('owner') && !actorRoles.includes('chef')
  if (newRoles && isHrOnly && (newRoles.includes('owner') || newRoles.includes('chef'))) {
    return NextResponse.json({ error: 'Personal (HR) darf keine Rollen Inhaber oder Chef vergeben. Nur Inhaber oder Chef können das.' }, { status: 403 })
  }
  if (newRoles) updates.roles = newRoles
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (body.reports_to_id !== undefined) updates.reports_to_id = body.reports_to_id === null || body.reports_to_id === '' ? null : body.reports_to_id

  if (body.terminated_at !== undefined) {
    updates.terminated_at = body.terminated_at === null || body.terminated_at === '' ? null : body.terminated_at
    updates.is_active = updates.terminated_at ? false : true
  }

  for (const key of PROFILE_KEYS) {
    if (key === 'terminated_at') continue
    if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key]
  }

  if (Object.keys(updates).length <= 1) return NextResponse.json({ error: 'Nichts zu ändern' }, { status: 400 })

  const { data: current } = await admin.from('staff').select('email, roles, is_active').eq('id', id).single()
  const oldRecord = current ? { email: current.email, roles: current.roles, is_active: current.is_active } : {}
  const newRecord = { ...oldRecord, ...updates }
  const profileOnly: Record<string, unknown> = {}
  for (const key of PROFILE_KEYS) {
    if (key === 'terminated_at') {
      if (updates.terminated_at !== undefined) profileOnly.terminated_at = updates.terminated_at
    } else if (updates[key] !== undefined) profileOnly[key] = updates[key]
  }
  if (updates.is_active !== undefined) profileOnly.is_active = updates.is_active
  if (Object.keys(profileOnly).length) profileOnly.updated_at = new Date().toISOString()

  let result = await admin.from('staff').update(updates).eq('id', id).select().single()
  let error = result.error

  // Fallback: Tabelle hat nur Spalte "role" (vor migration-staff-multi-roles)
  if (error && newRoles && (error.code === '42703' || error.message?.includes('roles') || error.message?.includes('does not exist'))) {
    const roleUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (newRoles.length) roleUpdates.role = newRoles[0]
    if (typeof body.is_active === 'boolean') roleUpdates.is_active = body.is_active
    if (body.terminated_at !== undefined) {
      roleUpdates.terminated_at = body.terminated_at === null || body.terminated_at === '' ? null : body.terminated_at
      roleUpdates.is_active = roleUpdates.terminated_at ? false : true
    }
    result = await admin.from('staff').update(roleUpdates).eq('id', id).select().single()
    error = result.error
    if (error && (error.code === '23514' || error.message?.includes('check'))) {
      const legacyRole = ['owner', 'admin', 'support'].includes(newRoles[0]) ? newRoles[0] : newRoles[0] === 'chef' ? 'owner' : newRoles[0] === 'product_care' ? 'admin' : 'support'
      roleUpdates.role = legacyRole
      result = await admin.from('staff').update(roleUpdates).eq('id', id).select().single()
      error = result.error
    }
    // Profilfelder ggf. in zweitem Update (Tabelle hat profile, aber keine roles)
    if (!error && Object.keys(profileOnly).length > 1) {
      await admin.from('staff').update(profileOnly).eq('id', id)
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logEntityChanges(admin, 'staff', id, oldRecord, newRecord, { email: actor?.email, id: actor?.id })
  return NextResponse.json(result.data)
}

/**
 * DELETE – Mitarbeiter entfernen: Eintrag in staff löschen und Auth-User löschen (falls vorhanden).
 * Passwörter sind nie sichtbar; Löschen entzieht nur den Zugang.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isStaffManager, isOwner } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber, Chef oder Personal (HR) können Accounts löschen.' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: row } = await admin.from('staff').select('id, user_id, email, roles').eq('id', id).single()
  if (!row) return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
  if (row.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && !isOwner) {
    return NextResponse.json({ error: 'Das Inhaber-Konto darf nur vom Inhaber selbst gelöscht werden.' }, { status: 403 })
  }

  const { staff: actor } = await getAdminContext()

  await writeAuditLog(admin, { entity_type: 'staff', entity_id: id, action: 'delete', changed_by_email: actor?.email ?? undefined, changed_by_id: actor?.id ?? undefined }, { email: actor?.email, id: actor?.id })
  const userId = row.user_id
  const { error: deleteError } = await admin.from('staff').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (userId) {
    try {
      await admin.auth.admin.deleteUser(userId)
    } catch (e) {
      console.error('[Staff delete] Auth user delete:', e)
    }
  }

  return NextResponse.json({ success: true })
}
