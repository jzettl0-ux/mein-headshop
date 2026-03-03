import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getReturnAddress } from '@/lib/shipping-settings'
import { formatAddressLinesForLabel } from '@/lib/return-address-formats'
import type { CustomerAddress, ReturnAddress } from '@/lib/return-address-formats'

export const dynamic = 'force-dynamic'

/**
 * GET – Formatiertes Absender/Empfänger-Adressblock für Retoure-Druck.
 * Carrier-spezifisch wie Versanddienstleister vorschreiben.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { id } = await Promise.resolve(context.params)
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, user_id, shipping_address, return_carrier_preference, return_shipping_options')
    .eq('id', id)
    .single()

  if (error || !order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  if (order.user_id && order.user_id !== user.id) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const addr = (order.shipping_address as Record<string, unknown>) || {}
  const customerAddr: CustomerAddress = {
    name: undefined,
    first_name: addr.first_name as string,
    last_name: addr.last_name as string,
    street: addr.street as string,
    house_number: (addr.house_number ?? addr.houseNumber) as string,
    postal_code: (addr.postal_code ?? addr.postalCode) as string,
    city: addr.city as string,
    country: (addr.country as string) ?? 'DE',
  }

  const ra = await getReturnAddress()
  const returnAddr: ReturnAddress = {
    name: ra.name,
    street: ra.street,
    house_number: ra.house_number,
    postal_code: ra.postal_code,
    city: ra.city,
    country: ra.country,
  }

  const preferred = (order.return_carrier_preference ?? order.return_shipping_options?.[0]?.carrier ?? 'dhl') as string
  const carrier = preferred?.toLowerCase() || 'dhl'

  const { senderLines, recipientLines } = formatAddressLinesForLabel(carrier, customerAddr, returnAddr)

  return NextResponse.json({ senderLines, recipientLines, carrier })
}
