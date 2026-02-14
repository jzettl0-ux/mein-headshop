import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

/**
 * POST body: { code: string, subtotal: number }
 * Returns: { valid: boolean, discountAmount: number, message?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json()
    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json(
        { valid: false, discountAmount: 0, message: 'Ungültige Anfrage' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()
    const { data: row, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', String(code).trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !row) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        message: 'Rabattcode nicht gefunden oder nicht gültig.',
      })
    }

    const now = new Date()
    const validFrom = new Date(row.valid_from)
    const validUntil = row.valid_until ? new Date(row.valid_until) : null
    if (validFrom > now) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        message: 'Dieser Code ist noch nicht gültig.',
      })
    }
    if (validUntil && validUntil < now) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        message: 'Dieser Code ist abgelaufen.',
      })
    }
    if (row.max_uses != null && row.used_count >= row.max_uses) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        message: 'Dieser Code wurde bereits maximal genutzt.',
      })
    }
    const minOrder = row.min_order_amount != null ? Number(row.min_order_amount) : 0
    if (subtotal < minOrder) {
      return NextResponse.json({
        valid: false,
        discountAmount: 0,
        message: `Mindestbestellwert: ${minOrder.toFixed(2)} €`,
      })
    }

    let discountAmount = 0
    if (row.type === 'percent') {
      discountAmount = Math.round((subtotal * Number(row.value)) / 100 * 100) / 100
    } else {
      discountAmount = Math.min(Number(row.value), subtotal)
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      code: row.code,
    })
  } catch (e) {
    return NextResponse.json(
      { valid: false, discountAmount: 0, message: 'Fehler bei der Prüfung' },
      { status: 500 }
    )
  }
}
