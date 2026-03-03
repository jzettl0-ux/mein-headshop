import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste aller Beschwerden (nur Inhaber/Chef).
 */
export async function GET() {
  const { isStaffManager } = await getAdminContext()
  if (!isStaffManager) return NextResponse.json({ error: 'Nur Inhaber oder Chef können Beschwerden einsehen.' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('staff_complaints')
    .select('id, staff_id, author_email, subject, message, created_at, read_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/**
 * POST – Beschwerde einreichen (jeder eingeloggte Mitarbeiter).
 * Body: { subject: string, message: string }
 */
export async function POST(req: NextRequest) {
  const { staff, isAdmin } = await getAdminContext()
  if (!isAdmin || !staff?.email) return NextResponse.json({ error: 'Nur eingeloggte Mitarbeiter können Beschwerden einreichen.' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!subject || !message) return NextResponse.json({ error: 'Betreff und Nachricht sind erforderlich.' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('staff_complaints')
    .insert({
      staff_id: staff.id,
      author_email: staff.email,
      subject,
      message,
    })
    .select('id, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id, created_at: data.created_at })
}
