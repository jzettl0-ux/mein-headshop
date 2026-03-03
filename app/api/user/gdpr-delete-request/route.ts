import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendGdprDeleteConfirmEmail, getGdprDeleteConfirmLink, hasGdprDeleteEmail } from '@/lib/send-gdpr-delete-confirm-email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/user/gdpr-delete-request
 * Leitet eine offizielle Lösch-Anfrage ein (Art. 17 DSGVO).
 * Erstellt einen Token, speichert in gdpr_deletion_requests und sendet Bestätigungs-Mail.
 */
export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  if (!hasGdprDeleteEmail()) return NextResponse.json({ error: 'E-Mail-Versand nicht konfiguriert' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const uid = user.id
  const email = user.email ?? ''

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: insertErr } = await admin.from('gdpr_deletion_requests').insert({
    user_id: uid,
    token,
    expires_at: expiresAt,
  })

  if (insertErr) {
    console.error('[GDPR Delete Request] insert error:', insertErr)
    return NextResponse.json({ error: 'Anfrage konnte nicht gespeichert werden' }, { status: 500 })
  }

  const confirmLink = getGdprDeleteConfirmLink(token)
  const { ok, error: sendErr } = await sendGdprDeleteConfirmEmail(email, confirmLink)
  if (!ok) {
    return NextResponse.json({ error: sendErr ?? 'E-Mail konnte nicht versendet werden' }, { status: 500 })
  }

  await admin.from('security_audit_logs').insert({
    event: 'GDPR_DELETE_REQUEST',
    user_id: uid,
    user_email: email,
    metadata: { expires_at: expiresAt },
  })

  return NextResponse.json({
    success: true,
    message: 'Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet. Bitte klicken Sie auf den Link in der E-Mail, um die Löschung abzuschließen.',
  })
}
