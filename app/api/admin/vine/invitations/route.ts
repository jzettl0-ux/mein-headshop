import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { randomBytes } from 'crypto'
import { sendVineInviteEmail } from '@/lib/send-vine-invite-email'

/**
 * GET /api/admin/vine/invitations
 * Liste aller Vine-Einladungen (optional ?product_id=).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')

  const admin = createSupabaseAdmin()
  try {
    let q = admin
      .schema('cx')
      .from('vine_invitations')
      .select('invitation_id, product_id, tester_email, status, sample_order_id, shipped_at, token, invited_at, responded_at')
    if (productId) q = q.eq('product_id', productId)
    const { data: rows, error } = await q.order('invited_at', { ascending: false })

    if (error) {
      console.error('[vine/invitations]', error.message)
      return NextResponse.json([])
    }
    if (!rows?.length) return NextResponse.json([])

    const productIds = [...new Set(rows.map((r: { product_id: string }) => r.product_id))]
    const { data: prods } = await admin.from('products').select('id, name, slug').in('id', productIds)
    const prodMap = new Map((prods ?? []).map((p: { id: string }) => [p.id, p]))

    const result = rows.map((r: Record<string, unknown>) => ({
      ...r,
      products: prodMap.get(r.product_id as string) ?? null,
    }))
    return NextResponse.json(result)
  } catch (e) {
    console.error('[vine/invitations]', e)
    return NextResponse.json([])
  }
}

/**
 * POST /api/admin/vine/invitations
 * Tester per E-Mail einladen.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { product_id, tester_email, send_email } = body
  if (!product_id || !tester_email?.trim()) {
    return NextResponse.json({ error: 'product_id und tester_email erforderlich' }, { status: 400 })
  }

  const email = String(tester_email).trim().toLowerCase()
  const admin = createSupabaseAdmin()

  const { data: existing } = await admin
    .schema('cx')
    .from('vine_invitations')
    .select('invitation_id')
    .eq('product_id', product_id)
    .eq('tester_email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Tester wurde bereits für dieses Produkt eingeladen' }, { status: 409 })
  }

  const token = randomBytes(24).toString('hex')
  const { data, error } = await admin
    .schema('cx')
    .from('vine_invitations')
    .insert({
      product_id,
      tester_email: email,
      status: 'invited',
      token,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const acceptUrl = `${baseUrl}/vine/einladung?token=${token}`

  const { data: product } = await admin.from('products').select('name').eq('id', product_id).single()
  const productName = (product as { name?: string })?.name ?? 'Produkt'

  let emailSent = false
  const sendEmail = body.send_email !== false
  if (sendEmail) {
    const emailResult = await sendVineInviteEmail({
      testerEmail: email,
      productName,
      acceptUrl,
    })
    emailSent = emailResult.ok
    if (!emailResult.ok) {
      console.warn('[Vine] Einladungs-E-Mail konnte nicht versendet werden:', emailResult.error)
    }
  }

  return NextResponse.json({
    ...data,
    accept_url: acceptUrl,
    email_sent: emailSent,
    message: emailSent
      ? 'Einladung erstellt. E-Mail wurde an den Tester gesendet.'
      : 'Einladung erstellt. Teile den Link manuell (E-Mail konnte nicht versendet werden).',
  })
}
