import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { executeGdprDeletion } from '@/lib/gdpr-delete-customer'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/gdpr-delete-confirm?token=...
 * Bestätigt die Konto-Löschung (Art. 17 DSGVO). Token aus der E-Mail.
 * Führt vollständige Anonymisierung durch (Bestellungen für Finanzamt, Anfragen, Bewertungen)
 * und löscht den Auth-User.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.redirect(new URL('/profile/privacy?error=missing_token', req.url))
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.redirect(new URL('/profile/privacy?error=service_unavailable', req.url))
  }

  const admin = createSupabaseAdmin()
  const { data: requestRow, error: fetchErr } = await admin
    .from('gdpr_deletion_requests')
    .select('id, user_id, expires_at, confirmed_at')
    .eq('token', token)
    .maybeSingle()

  if (fetchErr || !requestRow) {
    return NextResponse.redirect(new URL('/profile/privacy?error=invalid_token', req.url))
  }
  if (requestRow.confirmed_at) {
    return NextResponse.redirect(new URL('/profile/privacy?error=already_confirmed', req.url))
  }
  if (new Date(requestRow.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/profile/privacy?error=token_expired', req.url))
  }

  const userId = requestRow.user_id as string
  const { data: user } = await admin.auth.admin.getUserById(userId)
  const userEmail = user?.user?.email ?? ''

  await admin.from('gdpr_deletion_requests').update({ confirmed_at: new Date().toISOString() }).eq('id', requestRow.id)

  const result = await executeGdprDeletion(admin, userId, userEmail)
  if (!result.success) {
    console.error('[GDPR Delete Confirm] error:', result.error)
    await admin.from('security_audit_logs').insert({
      event: 'GDPR_DELETE_CONFIRM_FAILED',
      user_id: userId,
      user_email: userEmail,
      metadata: { error: result.error },
    })
    return NextResponse.redirect(new URL('/profile/privacy?error=delete_failed', req.url))
  }

  await admin.from('security_audit_logs').insert({
    event: 'GDPR_DELETE_CONFIRMED',
    user_id: userId,
    user_email: userEmail,
    metadata: {
      anonymizedOrders: result.anonymizedOrders,
      anonymizedInquiries: result.anonymizedInquiries,
      anonymizedReviews: result.anonymizedReviews,
      anonymizedReferrals: result.anonymizedReferrals,
    },
  })

  const base = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
  return NextResponse.redirect(new URL('/auth?deleted=1', base))
}
