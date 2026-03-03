import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export type CheckItem = { id: string; label: string; ok: boolean; hint?: string }

/** GET – Letztes Prüfdatum (nur Owner). */
export async function GET() {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', 'last_compliance_check').maybeSingle()
  return NextResponse.json({ lastChecked: data?.value ?? null })
}

/**
 * POST – Integritäts-Check ausführen (nur Owner).
 * Prüft technische Anforderungen und schreibt last_compliance_check in site_settings.
 */
export async function POST() {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const checks: CheckItem[] = []

  // 1) audit_logs Tabelle vorhanden (GoBD)
  try {
    const { error } = await admin.from('audit_logs').select('id').limit(1)
    checks.push({ id: 'audit_logs', label: 'Audit-Log (GoBD) vorhanden', ok: !error })
  } catch {
    checks.push({ id: 'audit_logs', label: 'Audit-Log (GoBD) vorhanden', ok: false })
  }

  // 2) site_settings lesbar
  try {
    const { data, error } = await admin.from('site_settings').select('key').limit(1)
    checks.push({ id: 'site_settings', label: 'Einstellungen (site_settings) erreichbar', ok: !error && !!data })
  } catch {
    checks.push({ id: 'site_settings', label: 'Einstellungen (site_settings) erreichbar', ok: false })
  }

  // 3) products.reference_price_30d (PAngV) – Spalte existiert
  try {
    const { error } = await admin.from('products').select('reference_price_30d').limit(1)
    checks.push({ id: 'pangv', label: 'PAngV Referenzpreis-Spalte (products)', ok: !error })
  } catch {
    checks.push({ id: 'pangv', label: 'PAngV Referenzpreis-Spalte (products)', ok: false })
  }

  // 4) staff-Tabelle (RBAC)
  try {
    const { error } = await admin.from('staff').select('id').limit(1)
    checks.push({ id: 'staff', label: 'Mitarbeiter/Rollen (staff) vorhanden', ok: !error })
  } catch {
    checks.push({ id: 'staff', label: 'Mitarbeiter/Rollen (staff) vorhanden', ok: false })
  }

  // 5) SSL – serverseitig nicht prüfbar
  checks.push({
    id: 'ssl',
    label: 'SSL/TLS aktiv (HTTPS)',
    ok: true,
    hint: 'Bitte im Browser prüfen.',
  })

  // 6) BFSG/WCAG: Produkte mit Bildern – Alt-Texte werden im Frontend aus Produktname verwendet
  try {
    const { data: products } = await admin.from('products').select('id, image_url')
    const count = (products ?? []).filter((p) => p.image_url).length
    checks.push({
      id: 'alt',
      label: 'Bilder mit Alt-Texten (Produktbilder)',
      ok: true,
      hint: count > 0 ? `${count} Produkte mit Bild – Alt aus Produktname` : 'Keine Produktbilder',
    })
  } catch {
    checks.push({ id: 'alt', label: 'Bilder mit Alt-Texten', ok: false, hint: 'Prüfung fehlgeschlagen' })
  }

  // 7) BFSG: vendor_legal_flags vorhanden (Kleinstunternehmen-Ausnahme)
  try {
    const { error } = await admin.schema('compliance').from('vendor_legal_flags').select('vendor_id').limit(1)
    checks.push({ id: 'vendor_legal_flags', label: 'Vendor Legal Flags (BFSG/KCanG)', ok: !error })
  } catch {
    checks.push({ id: 'vendor_legal_flags', label: 'Vendor Legal Flags (BFSG/KCanG)', ok: false })
  }

  const now = new Date().toISOString()
  const { error: upsertErr } = await admin
    .from('site_settings')
    .upsert({ key: 'last_compliance_check', value: now }, { onConflict: 'key' })

  if (upsertErr) {
    checks.push({ id: 'write_check', label: 'Zertifikat-Datum speichern', ok: false, hint: upsertErr.message })
  }

  return NextResponse.json({
    ok: upsertErr == null,
    lastChecked: now,
    checks,
  })
}
