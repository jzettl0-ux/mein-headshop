/**
 * Öffentliches Vendor-Anfrage-Formular (Partner werden)
 * POST – speichert in vendor_inquiries
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { isRecaptchaConfigured, verifyRecaptcha } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return `vendor-inquiry:${ip}`
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getClientId(req), 3, 900)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte in 15 Minuten erneut versuchen.' },
        { status: 429 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Anfrage derzeit nicht möglich.' }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    if (body.website_url != null && String(body.website_url).trim() !== '') {
      return NextResponse.json({ success: true })
    }

    const companyName = typeof body.company_name === 'string' ? body.company_name.trim().slice(0, 255) : ''
    const contactEmail = typeof body.contact_email === 'string' ? body.contact_email.trim().slice(0, 255) : ''
    const contactPerson = typeof body.contact_person === 'string' ? body.contact_person.trim().slice(0, 255) : ''
    const contactPhone = typeof body.contact_phone === 'string' ? body.contact_phone.trim().slice(0, 50) : ''
    const legalForm = typeof body.legal_form === 'string' ? body.legal_form.trim().slice(0, 50) : ''
    const vatId = typeof body.vat_id === 'string' ? body.vat_id.trim().slice(0, 50) : ''
    const addressStreet = typeof body.address_street === 'string' ? body.address_street.trim().slice(0, 255) : ''
    const addressZip = typeof body.address_zip === 'string' ? body.address_zip.trim().slice(0, 20) : ''
    const addressCity = typeof body.address_city === 'string' ? body.address_city.trim().slice(0, 100) : ''
    const addressCountry = typeof body.address_country === 'string' ? body.address_country.trim().slice(0, 2) || 'DE' : 'DE'
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : ''
    const productInterest = typeof body.product_interest === 'string' ? body.product_interest.trim().slice(0, 500) : ''
    const partnerType = body.partner_type === 'influencer' ? 'influencer' : 'company'
    const influencerLinksRaw = body.influencer_links
    const bfsgMicroEnterprise = partnerType === 'company' && body.bfsg_micro_enterprise_exemption === true
    const influencerLinks: Record<string, string> = {}
    if (partnerType === 'influencer' && influencerLinksRaw && typeof influencerLinksRaw === 'object') {
      const keys = ['instagram', 'tiktok', 'youtube', 'twitter', 'twitch', 'andere']
      for (const k of keys) {
        const v = influencerLinksRaw[k]
        if (typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 500) {
          influencerLinks[k] = v.trim()
        }
      }
    }
    const captchaToken = typeof body.captcha_token === 'string' ? body.captcha_token.trim() : ''

    if (!companyName || !contactEmail) {
      return NextResponse.json(
        { error: 'Firmenname und E-Mail sind erforderlich.' },
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
    const { error } = await admin.from('vendor_inquiries').insert({
      partner_type: partnerType,
      bfsg_micro_enterprise_exemption: partnerType === 'company' ? bfsgMicroEnterprise : null,
      company_name: companyName,
      contact_email: contactEmail,
      contact_person: contactPerson || null,
      contact_phone: contactPhone || null,
      legal_form: legalForm || null,
      vat_id: vatId || null,
      address_street: addressStreet || null,
      address_zip: addressZip || null,
      address_city: addressCity || null,
      address_country: addressCountry,
      message: message || null,
      product_interest: productInterest || null,
      influencer_links: Object.keys(influencerLinks).length > 0 ? influencerLinks : null,
      status: 'pending',
    })

    if (error) {
      console.error('[vendor-inquiry] insert error', error)
      return NextResponse.json({ error: 'Anfrage konnte nicht gespeichert werden.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Deine Anfrage wurde gesendet. Wir melden uns zeitnah bei dir.',
    })
  } catch (e) {
    console.error('[vendor-inquiry]', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
