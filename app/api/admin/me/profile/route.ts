import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { OWNER_EMAIL } from '@/lib/owner-email'

export const dynamic = 'force-dynamic'

type ContactPerson = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  label: string
  role_hint?: string
}

/**
 * GET – Eigenes Mitarbeiterprofil inkl. Ansprechpartner (Vorgesetzte/r, Teamleiter).
 * Zeigt: Wer ist für mich zuständig, an wen wende ich mich bei Problemen?
 */
export async function GET() {
  const { user, staff, roles, isAdmin } = await getAdminContext()
  if (!user || !isAdmin) {
    return NextResponse.json({ error: 'Nicht angemeldet oder keine Admin-Berechtigung' }, { status: 401 })
  }

  // Inhaber ohne Staff-Eintrag: minimales Profil, Ansprechpartner = niemand (du bist Inhaber)
  if (!staff && user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    return NextResponse.json({
      staff: null,
      contact: null,
      fallback_contact: null,
      org_tree: null,
      message: 'Du bist Inhaber. Für Mitarbeiterfragen ist die Geschäftsführung (du) der Ansprechpartner.',
    })
  }

  if (!staff) {
    return NextResponse.json({ error: 'Kein Mitarbeiterprofil gefunden' }, { status: 404 })
  }

  let contact: ContactPerson | null = null
  let fallback_contact: ContactPerson | null = null

  if (hasSupabaseAdmin()) {
    const admin = createSupabaseAdmin()

    // Direkter Ansprechpartner (reports_to_id)
    const reportsToId = (staff as { reports_to_id?: string | null }).reports_to_id
    if (reportsToId) {
      const { data: reportsToRow } = await admin
        .from('staff')
        .select('id, email, first_name, last_name, roles')
        .eq('id', reportsToId)
        .eq('is_active', true)
        .maybeSingle()
      if (reportsToRow) {
        const r = reportsToRow as { id: string; email: string; first_name?: string | null; last_name?: string | null; roles?: string[] }
        const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.email
        const roleHint = r.roles?.includes('chef') ? 'Chef / Geschäftsführung' : r.roles?.includes('owner') ? 'Inhaber' : r.roles?.includes('admin') ? 'Admin' : 'Ansprechpartner'
        contact = {
          id: r.id,
          email: r.email,
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
          label: name,
          role_hint: roleHint,
        }
      }
    }

    // Fallback: Kein Vorgesetzter hinterlegt → erste aktive Person mit Rolle Owner oder Chef als Ansprechpartner
    if (!contact) {
      const { data: allStaff } = await admin
        .from('staff')
        .select('id, email, first_name, last_name, roles')
        .eq('is_active', true)
        .neq('id', staff.id)
      const list = (allStaff ?? []) as { id: string; email: string; first_name?: string | null; last_name?: string | null; roles?: string[] }[]
      const ownerOrChef = list.find((s) => s.roles?.includes('owner') || s.roles?.includes('chef'))
      if (ownerOrChef) {
        const name = [ownerOrChef.first_name, ownerOrChef.last_name].filter(Boolean).join(' ').trim() || ownerOrChef.email
        const roleHint = ownerOrChef.roles?.includes('owner') ? 'Inhaber' : 'Chef / Geschäftsführung'
        fallback_contact = {
          id: ownerOrChef.id,
          email: ownerOrChef.email,
          first_name: ownerOrChef.first_name ?? null,
          last_name: ownerOrChef.last_name ?? null,
          label: name,
          role_hint: roleHint,
        }
      }
    }
  }

  const roleLabels: Record<string, string> = {
    owner: 'Inhaber',
    chef: 'Chef / Geschäftsführung',
    admin: 'Shop-Administrator',
    product_care: 'Produktpflege',
    support: 'Kundenservice',
    employee: 'Lager / Versand',
    hr: 'Personal / Einstellung',
    team_leader: 'Teamleiter',
    warehouse_lead: 'Lagerleitung',
    marketing: 'Marketing',
  }
  const myRoles = (staff.roles ?? []).map((r) => roleLabels[r] || r)

  type StaffNode = { id: string; email: string; first_name: string | null; last_name: string | null; label: string; role_hint: string; reports_to_id: string | null }
  let above_me: StaffNode[] = []
  let below_me: StaffNode[] = []

  if (hasSupabaseAdmin()) {
    const admin = createSupabaseAdmin()
    const toNode = (r: { id: string; email: string; first_name?: string | null; last_name?: string | null; roles?: string[]; reports_to_id?: string | null }): StaffNode => {
      const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.email
      const roleHint = r.roles?.includes('owner') ? 'Inhaber' : r.roles?.includes('chef') ? 'Chef' : r.roles?.includes('admin') ? 'Admin' : r.roles?.includes('hr') ? 'Personal' : r.roles?.includes('team_leader') ? 'Teamleiter' : r.roles?.includes('warehouse_lead') ? 'Lagerleitung' : r.roles?.includes('marketing') ? 'Marketing' : r.roles?.includes('product_care') ? 'Produktpflege' : r.roles?.includes('support') ? 'Kundenservice' : 'Mitarbeiter'
      return { id: r.id, email: r.email, first_name: r.first_name ?? null, last_name: r.last_name ?? null, label: name, role_hint: roleHint, reports_to_id: r.reports_to_id ?? null }
    }

    // Kette nach oben (Vorgesetzte bis Spitze)
    let currentId = (staff as { reports_to_id?: string | null }).reports_to_id ?? null
    const seen = new Set<string>()
    while (currentId && !seen.has(currentId)) {
      seen.add(currentId)
      const { data: row } = await admin.from('staff').select('id, email, first_name, last_name, roles, reports_to_id').eq('id', currentId).eq('is_active', true).maybeSingle()
      if (!row) break
      const r = row as { id: string; email: string; first_name?: string | null; last_name?: string | null; roles?: string[]; reports_to_id?: string | null }
      above_me.push(toNode(r))
      currentId = r.reports_to_id ?? null
    }

    // Direkt unter mir (berichten an mich)
    const { data: subs } = await admin.from('staff').select('id, email, first_name, last_name, roles, reports_to_id').eq('reports_to_id', staff.id).eq('is_active', true)
    below_me = (subs ?? []).map((r: Record<string, unknown>) => toNode(r as Parameters<typeof toNode>[0]))
  }

  const meNode: StaffNode = {
    id: staff.id,
    email: staff.email,
    first_name: (staff as { first_name?: string | null }).first_name ?? null,
    last_name: (staff as { last_name?: string | null }).last_name ?? null,
    label: [(staff as { first_name?: string | null }).first_name, (staff as { last_name?: string | null }).last_name].filter(Boolean).join(' ').trim() || staff.email,
    role_hint: myRoles[0] ?? 'Mitarbeiter',
    reports_to_id: (staff as { reports_to_id?: string | null }).reports_to_id ?? null,
  }

  return NextResponse.json({
    staff: {
      id: staff.id,
      email: staff.email,
      roles: staff.roles ?? [],
      role_labels: myRoles,
      reports_to_id: (staff as { reports_to_id?: string | null }).reports_to_id ?? null,
      lead_for_area_id: (staff as { lead_for_area_id?: string | null }).lead_for_area_id ?? null,
    },
    contact,
    fallback_contact,
    org_tree: {
      above: above_me,
      me: meNode,
      below: below_me,
    },
  })
}
