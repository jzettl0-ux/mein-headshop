/**
 * Webhook: MCF-Order von Shopify/WooCommerce/externem Shop
 * POST – Erstellt MCF-Order für Fulfillment
 *
 * Headers: X-MCF-Secret (optional, für Auth)
 * Body: { vendor_id, external_order_reference, shipping_address, shipping_speed?, items? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const MCF_SECRET = process.env.MCF_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  if (MCF_SECRET) {
    const secret = req.headers.get('x-mcf-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
    if (secret !== MCF_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { vendor_id, external_order_reference, shipping_address, shipping_speed, items } = body

  if (!vendor_id || !external_order_reference || !shipping_address) {
    return NextResponse.json(
      { error: 'vendor_id, external_order_reference, shipping_address erforderlich' },
      { status: 400 }
    )
  }

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin
    .schema('logistics')
    .from('mcf_orders')
    .select('mcf_order_id')
    .eq('vendor_id', vendor_id)
    .eq('external_order_reference', String(external_order_reference).trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      mcf_order_id: (existing as { mcf_order_id: string }).mcf_order_id,
      message: 'Order bereits vorhanden (Idempotenz)',
    })
  }

  const validSpeed = ['STANDARD', 'EXPEDITED', 'PRIORITY'].includes(shipping_speed) ? shipping_speed : 'STANDARD'

  const { data, error } = await admin
    .schema('logistics')
    .from('mcf_orders')
    .insert({
      vendor_id,
      external_order_reference: String(external_order_reference).trim(),
      shipping_speed: validSpeed,
      shipping_address: typeof shipping_address === 'object' ? shipping_address : { raw: shipping_address },
      items: Array.isArray(items) ? items : [],
      status: 'RECEIVED',
    })
    .select('mcf_order_id, status')
    .single()

  if (error) {
    console.error('[webhooks/mcf]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    mcf_order_id: (data as { mcf_order_id: string }).mcf_order_id,
    status: (data as { status: string }).status,
  })
}
