import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – B2B-Kontostatus des eingeloggten Users */
export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ has_b2b: false, status: null })
  if (!hasSupabaseAdmin()) return NextResponse.json({ has_b2b: false, status: null })

  const admin = createSupabaseAdmin()
  const { data } = await admin
    .schema('b2b')
    .from('business_accounts')
    .select('id, status, company_name, vat_id, vat_validated_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    has_b2b: !!data,
    status: data?.status ?? null,
    company_name: data?.company_name ?? null,
    vat_id: data?.vat_id ?? null,
    vat_validated: !!data?.vat_validated_at,
  })
}
