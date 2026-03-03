/**
 * Phase 5.1: DDG Notice & Action – Meldung illegaler Inhalte
 * POST – Öffentliches Formular (ohne Auth), speichert in compliance.ddg_content_reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { isRecaptchaConfigured, verifyRecaptcha } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

const VIOLATION_TYPES = ['ILLEGAL_DRUG_CONTENT', 'YOUTH_PROTECTION', 'IP_INFRINGEMENT', 'OTHER'] as const

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return `ddg-report:${ip}`
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getClientId(req), 3, 900)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Zu viele Meldungen. Bitte in 15 Minuten erneut versuchen.' },
        { status: 429 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Meldung derzeit nicht möglich.' }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    if (body.website_url != null && String(body.website_url).trim() !== '') {
      return NextResponse.json({ success: true })
    }

    const targetRef = typeof body.target_ref === 'string' ? body.target_ref.trim().slice(0, 500) : ''
    const violationType = typeof body.violation_type === 'string' && VIOLATION_TYPES.includes(body.violation_type as typeof VIOLATION_TYPES[number])
      ? body.violation_type
      : 'OTHER'
    const description = typeof body.report_description === 'string' ? body.report_description.trim().slice(0, 5000) : ''
    const reporterEmailRaw = typeof body.reporter_email === 'string' ? body.reporter_email.trim().slice(0, 255) : ''
    const reporterEmail = reporterEmailRaw || null
    const captchaToken = typeof body.captcha_token === 'string' ? body.captcha_token.trim() : ''

    if (!reporterEmail || reporterEmail.length < 3) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse ist erforderlich (gegen Missbrauch).' },
        { status: 400 }
      )
    }

    if (!targetRef && !description) {
      return NextResponse.json(
        { error: 'Bitte gib an, welcher Inhalt gemeldet wird (URL/Produkt oder Beschreibung).' },
        { status: 400 }
      )
    }

    if (isRecaptchaConfigured()) {
      const verify = await verifyRecaptcha(captchaToken)
      if (!verify.success) {
        return NextResponse.json(
          { error: verify.error || 'Bitte bestätige, dass du kein Roboter bist (reCAPTCHA).' },
          { status: 400 }
        )
      }
    }

    const admin = createSupabaseAdmin()
    let targetProductId: string | null = null
    if (targetRef) {
      const slugMatch = targetRef.match(/\/shop\/([^/?]+)/)
      const slug = slugMatch ? slugMatch[1] : (targetRef.includes('/') ? null : targetRef)
      if (slug) {
        const { data: prod } = await admin
          .from('products')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        if (prod) targetProductId = prod.id
      }
    }

    const { error } = await admin
      .schema('compliance')
      .from('ddg_content_reports')
      .insert({
        reporter_id: null,
        target_asin: targetRef || 'nicht angegeben',
        target_product_id: targetProductId,
        violation_type: violationType,
        is_trusted_flagger: false,
        status: 'PENDING',
        report_description: description || null,
        reporter_email: reporterEmail,
      })

    if (error) {
      console.error('[ddg/report] insert error', error)
      return NextResponse.json({ error: 'Meldung konnte nicht gespeichert werden.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Deine Meldung wurde entgegengenommen. Wir prüfen den Inhalt zeitnah.',
    })
  } catch (e) {
    console.error('[ddg/report]', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
