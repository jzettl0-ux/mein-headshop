import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET – Ausstehende DSGVO-Löschanträge (Kunden haben angefordert, warten auf Bestätigungs-Mail-Klick)
 */
export async function GET() {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
    if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .from('gdpr_deletion_requests')
      .select('id, user_id, expires_at, created_at, confirmed_at')
      .is('confirmed_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('gdpr deletion-requests:', error.message)
      return NextResponse.json({ requests: [] })
    }

    const withEmails = await Promise.all(
      (data ?? []).map(async (row) => {
        let email = ''
        if (row.user_id) {
          try {
            const { data: user } = await admin.auth.admin.getUserById(row.user_id)
            email = user?.user?.email ?? ''
          } catch {
            email = '(unbekannt)'
          }
        }
        return { ...row, email }
      })
    )

    return NextResponse.json({ requests: withEmails })
  } catch (e) {
    console.error('gdpr deletion-requests:', e)
    return NextResponse.json({ requests: [] })
  }
}
