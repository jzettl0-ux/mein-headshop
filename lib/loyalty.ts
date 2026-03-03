export type LoyaltyTier = 'bronze' | 'silver' | 'gold'
export type LoyaltyReason = 'order' | 'review' | 'redemption' | 'adjustment'

export interface LoyaltyAccount {
  user_id: string
  points_balance: number
  tier: LoyaltyTier
  created_at?: string
  updated_at?: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  amount: number
  reason: LoyaltyReason
  reference_type: string | null
  reference_id: string | null
  created_at: string
}

export interface LoyaltySettings {
  enabled: boolean
  points_per_euro: number
  points_per_review: number
  points_per_eur_discount: number
  silver_min_points: number
  gold_min_points: number
  silver_discount_percent: number
  gold_discount_percent: number
  /** Mindestbestellwert (€), ab dem Silber-/Gold-Rabatt greift. 0 = immer. */
  min_order_eur_for_discount: number
}

const DEFAULT_SETTINGS: LoyaltySettings = {
  enabled: true,
  points_per_euro: 1,
  points_per_review: 50,
  points_per_eur_discount: 20,
  silver_min_points: 500,
  gold_min_points: 2000,
  silver_discount_percent: 5,
  gold_discount_percent: 10,
  min_order_eur_for_discount: 30,
}

export function getTierFromPoints(points: number, settings: LoyaltySettings): LoyaltyTier {
  if (points >= settings.gold_min_points) return 'gold'
  if (points >= settings.silver_min_points) return 'silver'
  return 'bronze'
}

export function getPointsToNextTier(points: number, settings: LoyaltySettings): { nextTier: LoyaltyTier | null; pointsNeeded: number } {
  const current = getTierFromPoints(points, settings)
  if (current === 'gold') return { nextTier: null, pointsNeeded: 0 }
  if (current === 'silver') return { nextTier: 'gold', pointsNeeded: Math.max(0, settings.gold_min_points - points) }
  return { nextTier: 'silver', pointsNeeded: Math.max(0, settings.silver_min_points - points) }
}

export function getTierDiscountPercent(tier: LoyaltyTier, settings: LoyaltySettings): number {
  if (tier === 'gold') return settings.gold_discount_percent
  if (tier === 'silver') return settings.silver_discount_percent
  return 0
}

/** Einstellungen aus loyalty_settings lesen (Server/Admin). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLoyaltySettings(admin: any): Promise<LoyaltySettings> {
  const result = { ...DEFAULT_SETTINGS }
  const { data: rows } = await admin.from('loyalty_settings').select('key, value')
  const arr = Array.isArray(rows) ? rows : []
  for (const row of arr) {
    const key = row?.key
    const val = row?.value
    if (!key) continue
    if (key === 'enabled') {
      result.enabled = val === 'true' || val === '1'
      continue
    }
    if (key in result) {
      const num = Number(val)
      if (Number.isFinite(num)) (result as unknown as Record<string, number>)[key] = num
    }
  }
  return result
}

/** Punkte gutschreiben oder abziehen; Tier aktualisieren. Doppelte Gutschrift für dieselbe reference (z. B. review) verhindern. Bei deaktiviertem Programm wird nichts gebucht. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addLoyaltyPoints(admin: any,
  userId: string,
  amount: number,
  reason: LoyaltyReason,
  referenceType?: string | null,
  referenceId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (amount === 0) return { ok: true }
  const settings = await getLoyaltySettings(admin)
  if (!settings.enabled) return { ok: true }
  if (referenceType && referenceId) {
    const { data: existing } = await admin.from('loyalty_transactions').select('id').eq('reference_type', referenceType).eq('reference_id', referenceId).maybeSingle()
    if (existing) return { ok: true }
  }
  const { data: account } = await admin.from('loyalty_accounts').select('points_balance, tier').eq('user_id', userId).maybeSingle()
  const currentBalance = account?.points_balance ?? 0
  const newBalance = Math.max(0, currentBalance + amount)
  if (amount < 0 && currentBalance + amount < 0) return { ok: false, error: 'Nicht genügend Punkte' }

  await admin.from('loyalty_transactions').insert({
    user_id: userId,
    amount,
    reason,
    reference_type: referenceType ?? null,
    reference_id: referenceId ?? null,
  })

  const newTier = getTierFromPoints(newBalance, settings)
  await admin.from('loyalty_accounts').upsert(
    {
      user_id: userId,
      points_balance: newBalance,
      tier: newTier,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  return { ok: true }
}

/** Alle Kundentiers anhand der aktuellen Punkte und Einstellungen neu berechnen (z. B. nach Änderung von silver_min_points/gold_min_points). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recalculateAllTiers(admin: any): Promise<number> {
  const settings = await getLoyaltySettings(admin)
  const { data: accounts } = await admin.from('loyalty_accounts').select('user_id, points_balance')
  if (!accounts?.length) return 0
  let updated = 0
  for (const acc of accounts) {
    const points = Number(acc.points_balance) || 0
    const newTier = getTierFromPoints(points, settings)
    const { error } = await admin
      .from('loyalty_accounts')
      .update({ tier: newTier, updated_at: new Date().toISOString() })
      .eq('user_id', acc.user_id)
    if (!error) updated += 1
  }
  return updated
}

/** Konto anlegen falls nicht vorhanden (z. B. nach erster Bestellung). */
export async function ensureLoyaltyAccount(
  admin: { from: (t: string) => any },
  userId: string
): Promise<void> {
  const { data } = await admin.from('loyalty_accounts').select('user_id').eq('user_id', userId).maybeSingle()
  if (!data) {
    await admin.from('loyalty_accounts').insert({ user_id: userId, points_balance: 0, tier: 'bronze' })
  }
}
