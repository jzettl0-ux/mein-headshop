import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'

/** GET – Öffentlich: Q&A für ein Produkt (nur beantwortete sichtbar) */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json([], { status: 200 })

  const productId = request.nextUrl.searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('product_qa')
    .select('id, question, answer, asked_by_name, status, answered_at, answered_by, created_at')
    .eq('product_id', productId)
    .eq('status', 'answered')
    .order('answered_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Öffentlich: Frage stellen (Rate-Limit) */
export async function POST(request: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const { allowed } = checkRateLimit(`product-qa:${ip}`, 5, 300)
  if (!allowed) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const productId = typeof body.product_id === 'string' ? body.product_id.trim() : ''
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  const askedByName = typeof body.asked_by_name === 'string' ? body.asked_by_name.trim().slice(0, 100) : null
  const askedByEmail = typeof body.asked_by_email === 'string' ? body.asked_by_email.trim().slice(0, 255) : null

  if (!productId || !question || question.length < 10) {
    return NextResponse.json({ error: 'product_id und Frage (min. 10 Zeichen) erforderlich.' }, { status: 400 })
  }
  const emailVal = askedByEmail?.trim()
  if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    return NextResponse.json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich (für Benachrichtigung bei Antwort).' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('product_qa')
    .insert({
      product_id: productId,
      question,
      asked_by_name: askedByName || null,
      asked_by_email: emailVal,
      status: 'pending',
    })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data.id, message: 'Frage wurde gesendet. Wir antworten bald.' })
}
