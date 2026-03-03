import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { generateReferralCode } from '@/lib/referral'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/** GET – Persönlichen Empfehlungscode des Nutzers (wird bei Bedarf angelegt). */
export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  let { data: row } = await admin.from('referral_codes').select('code').eq('user_id', user.id).maybeSingle()

  if (!row) {
    let code = generateReferralCode()
    for (let i = 0; i < 5; i++) {
      const { error } = await admin.from('referral_codes').insert({ user_id: user.id, code })
      if (!error) break
      if (error.code === '23505') code = generateReferralCode()
      else {
        console.error('referral_codes insert', error)
        return NextResponse.json({ error: 'Code konnte nicht erstellt werden' }, { status: 500 })
      }
    }
    const { data: newRow } = await admin.from('referral_codes').select('code').eq('user_id', user.id).maybeSingle()
    row = newRow ?? row
  }

  const code = row?.code ?? ''
  const link = `${BASE_URL}/auth?ref=${encodeURIComponent(code)}`

  return NextResponse.json({ code, link })
}
