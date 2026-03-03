import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { validateVatId } from '@/lib/vies'

export const dynamic = 'force-dynamic'

/**
 * POST – B2B-Geschäftskonto beantragen.
 * Body: { company_name, vat_id, billing_address? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const companyName = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const vatId = typeof body.vat_id === 'string' ? body.vat_id.trim().slice(0, 50) : ''
  const billingAddress = body.billing_address && typeof body.billing_address === 'object' ? body.billing_address : null

  if (!companyName || companyName.length < 2) {
    return NextResponse.json({ error: 'Firmenname erforderlich (min. 2 Zeichen)' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin
    .schema('b2b')
    .from('business_accounts')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Antrag liegt bereits vor. Bitte warte auf die Prüfung.' }, { status: 400 })
    }
    if (existing.status === 'approved') {
      return NextResponse.json({ error: 'Du hast bereits ein aktives B2B-Konto.' }, { status: 400 })
    }
  }

  let vatValidatedAt: string | null = null
  if (vatId) {
    const vies = await validateVatId(vatId)
    if (!vies.valid) {
      return NextResponse.json({ error: vies.error || 'USt-IdNr. ungültig' }, { status: 400 })
    }
    vatValidatedAt = new Date().toISOString()
  }

  const { data: inserted, error } = await admin
    .schema('b2b')
    .from('business_accounts')
    .upsert(
      {
        user_id: user.id,
        company_name: companyName,
        vat_id: vatId || null,
        vat_validated_at: vatValidatedAt,
        billing_address: billingAddress,
        status: 'pending',
        rejected_reason: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select('id, status, company_name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    success: true,
    message: 'B2B-Antrag wurde eingereicht. Wir melden uns nach Prüfung.',
    business_account: inserted,
  })
}
