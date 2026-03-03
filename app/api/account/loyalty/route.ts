import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getLoyaltySettings, getPointsToNextTier } from '@/lib/loyalty'
import type { LoyaltyTier } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

/** GET – Loyalty-Konto des eingeloggten Nutzers (Punkte, Tier, Transaktionen, Fortschritt). */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    if (!hasSupabaseAdmin()) return NextResponse.json({ enabled: false, points_balance: 0, tier: 'bronze', settings: {} }, { status: 200 })

    const admin = createSupabaseAdmin()
    const settings = await getLoyaltySettings(admin)
    if (!settings.enabled) {
      return NextResponse.json({
        enabled: false,
        points_balance: 0,
        tier: 'bronze',
        next_tier: null,
        points_needed: 0,
        progress_percent: 0,
        transactions: [],
        settings: {},
      })
    }

      const { data: account } = await admin
      .from('loyalty_accounts')
      .select('points_balance, tier')
      .eq('user_id', user.id)
      .maybeSingle()

    const pointsBalance = account?.points_balance ?? 0
    const tier = (account?.tier ?? 'bronze') as LoyaltyTier
    const { nextTier, pointsNeeded } = getPointsToNextTier(pointsBalance, settings)
    const currentTierStart = tier === 'gold' ? settings.gold_min_points : tier === 'silver' ? settings.silver_min_points : 0
    const nextTierStart = nextTier === 'silver' ? settings.silver_min_points : nextTier === 'gold' ? settings.gold_min_points : 0
    const progressInTier = nextTierStart > currentTierStart ? (pointsBalance - currentTierStart) / (nextTierStart - currentTierStart) : 1
    const progressPercent = Math.min(100, Math.round(progressInTier * 100))

    const { data: transactions } = await admin
      .from('loyalty_transactions')
      .select('id, amount, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    const reasonLabels: Record<string, string> = {
      order: 'Bestellung',
      review: 'Bewertung',
      redemption: 'Einlösung',
      adjustment: 'Anpassung',
    }

    return NextResponse.json({
      enabled: true,
      points_balance: pointsBalance,
      tier,
      next_tier: nextTier,
      points_needed: pointsNeeded,
      progress_percent: progressPercent,
      transactions: (transactions ?? []).map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        reason_label: reasonLabels[t.reason] ?? t.reason,
        created_at: t.created_at,
      })),
      settings: {
        points_per_eur_discount: settings.points_per_eur_discount,
        silver_discount_percent: settings.silver_discount_percent,
        gold_discount_percent: settings.gold_discount_percent,
        min_order_eur_for_discount: settings.min_order_eur_for_discount,
      },
    })
  } catch {
    return NextResponse.json({ enabled: false, points_balance: 0, tier: 'bronze', settings: {} }, { status: 200 })
  }
}
