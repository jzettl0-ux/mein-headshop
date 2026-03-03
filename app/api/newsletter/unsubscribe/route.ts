import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * GET – Abmeldung vom Newsletter via Link in der E-Mail (?token=subscriber_id).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/account?newsletter=missing`)
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.redirect(`${SITE_URL}/account?newsletter=error`)
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('newsletter_subscribers')
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', token)

  if (error) {
    return NextResponse.redirect(`${SITE_URL}/account?newsletter=error`)
  }
  return NextResponse.redirect(`${SITE_URL}/account?newsletter=unsubscribed`)
}
