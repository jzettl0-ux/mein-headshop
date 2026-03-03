/**
 * POST – Trade-In Quote berechnen
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { calculateTradeInQuote, TRADE_IN_CONDITION_QUESTIONS } from '@/lib/trade-in-quote'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { product_id, condition_answers } = body

  if (!product_id || typeof product_id !== 'string') {
    return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  }

  const answers = condition_answers && typeof condition_answers === 'object' ? condition_answers : {}
  const requiredKeys = ['condition', 'functionality', 'accessories']
  const missing = requiredKeys.filter((k) => !answers[k])
  if (missing.length > 0) {
    return NextResponse.json({
      error: 'Zustandsfragen unvollständig',
      required: requiredKeys,
    }, { status: 400 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: product, error } = await admin
    .from('products')
    .select('id, name, price')
    .eq('id', product_id)
    .single()

  if (error || !product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
  }

  const price = Number(product.price ?? 0)
  if (price <= 0) {
    return NextResponse.json({ error: 'Produkt nicht für Trade-In geeignet' }, { status: 400 })
  }

  const quoted_value = calculateTradeInQuote(price, answers)

  return NextResponse.json({
    product_id: product.id,
    product_name: product.name,
    product_price: price,
    quoted_value,
    condition_answers: answers,
  })
}

export async function GET() {
  return NextResponse.json({
    questions: TRADE_IN_CONDITION_QUESTIONS,
  })
}
