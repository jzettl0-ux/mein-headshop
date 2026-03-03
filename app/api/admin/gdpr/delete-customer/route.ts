import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext } from '@/lib/admin-auth'
import { executeGdprDeletion } from '@/lib/gdpr-delete-customer'

export const dynamic = 'force-dynamic'

/**
 * POST – Admin-triggered DSGVO-Löschung (manuell durch Inhaber)
 * Body: { userId?: string, email: string }
 * - userId: wenn Kunde Konto hat
 * - email: E-Mail des Kunden (für Anfragen, Bestellungen ohne Konto)
 */
export async function POST(req: NextRequest) {
  const { isOwner, staff } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber darf Kundendaten löschen' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  let body: { userId?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const userId = body.userId?.trim() || null

  if (!email && !userId) {
    return NextResponse.json({ error: 'E-Mail oder User-ID erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  let resolvedEmail = email
  let resolvedUserId = userId

  if (resolvedUserId && !resolvedEmail) {
    const { data: user } = await admin.auth.admin.getUserById(resolvedUserId)
    resolvedEmail = user?.user?.email ?? ''
    if (!resolvedEmail) {
      return NextResponse.json({ error: 'Nutzer nicht gefunden oder keine E-Mail' }, { status: 404 })
    }
  }
  if (!resolvedUserId && resolvedEmail) {
    const { data: ord } = await admin
      .from('orders')
      .select('user_id')
      .ilike('customer_email', resolvedEmail)
      .not('user_id', 'is', null)
      .limit(1)
      .maybeSingle()
    resolvedUserId = ord?.user_id ?? null
  }

  const result = await executeGdprDeletion(admin, resolvedUserId, resolvedEmail)

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error ?? 'Löschung fehlgeschlagen' },
      { status: 500 }
    )
  }

  await admin.from('security_audit_logs').insert({
    event: 'GDPR_ADMIN_DELETE',
    user_id: resolvedUserId ?? undefined,
    user_email: resolvedEmail,
    metadata: {
      by_admin: staff?.email,
      anonymizedOrders: result.anonymizedOrders,
      anonymizedInquiries: result.anonymizedInquiries,
      anonymizedReviews: result.anonymizedReviews,
      anonymizedReferrals: result.anonymizedReferrals,
    },
  })

  return NextResponse.json({
    success: true,
    anonymizedOrders: result.anonymizedOrders,
    anonymizedInquiries: result.anonymizedInquiries,
    anonymizedReviews: result.anonymizedReviews,
    anonymizedReferrals: result.anonymizedReferrals,
  })
}
