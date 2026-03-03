/**
 * Willkommens-E-Mail an Vendor erneut senden
 * POST – z. B. wenn Vendor die erste E-Mail nicht erhalten hat
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendVendorWelcomeEmail } from '@/lib/send-vendor-email'
import { getVendorRegistrationLink } from '@/lib/vendor-invite-link'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: vendor, error } = await admin
    .from('vendor_accounts')
    .select('id, company_name, contact_email, contact_person, user_id')
    .eq('id', id)
    .single()

  if (error || !vendor) {
    return NextResponse.json({ error: 'Vendor nicht gefunden' }, { status: 404 })
  }

  const email = vendor.contact_email?.trim()
  if (!email) {
    return NextResponse.json({ error: 'Vendor hat keine E-Mail-Adresse' }, { status: 400 })
  }

  const { actionLink, userId } = await getVendorRegistrationLink(email)
  if (userId && !vendor.user_id) {
    await admin.from('vendor_accounts').update({ user_id: userId, updated_at: new Date().toISOString() }).eq('id', id)
  }

  const result = await sendVendorWelcomeEmail(email, {
    companyName: vendor.company_name,
    contactPerson: vendor.contact_person || undefined,
    registrationLink: actionLink ?? undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
