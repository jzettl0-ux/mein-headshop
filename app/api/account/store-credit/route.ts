/**
 * GET – Store-Credit-Guthaben des eingeloggten Kunden
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    return NextResponse.json({ balance: 0 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ balance: 0 })
  }

  const admin = createSupabaseAdmin()
  const { data } = await admin
    .schema('recommerce')
    .from('store_credit_wallets')
    .select('current_balance')
    .eq('customer_id', user.id)
    .maybeSingle()

  const balance = Number(data?.current_balance ?? 0)
  return NextResponse.json({ balance })
}
