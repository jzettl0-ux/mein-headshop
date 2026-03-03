/**
 * POST – Trade-In Anfrage einreichen
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabase } from '@/lib/supabase-server'
import { calculateTradeInQuote } from '@/lib/trade-in-quote'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Bitte anmelden' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { product_id, condition_answers } = body

  if (!product_id || typeof product_id !== 'string') {
    return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  }

  const answers = condition_answers && typeof condition_answers === 'object' ? condition_answers : {}
  const requiredKeys = ['condition', 'functionality', 'accessories']
  const missing = requiredKeys.filter((k) => !answers[k])
  if (missing.length > 0) {
    return NextResponse.json({ error: 'Zustandsfragen unvollständig' }, { status: 400 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: product } = await admin
    .from('products')
    .select('id, name, price, asin')
    .eq('id', product_id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
  }

  const price = Number(product.price ?? 0)
  const quoted_value = calculateTradeInQuote(price, answers)

  const { data, error } = await admin
    .schema('recommerce')
    .from('trade_in_requests')
    .insert({
      customer_id: user.id,
      product_id: product.id,
      original_asin: product.asin ?? null,
      condition_answers: answers,
      quoted_value,
      status: 'PENDING',
    })
    .select()
    .single()

  if (error) {
    console.error('[trade-in/submit]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trade_in_id: data.trade_in_id })
}
