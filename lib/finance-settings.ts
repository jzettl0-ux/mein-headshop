import type { SupabaseClient } from '@supabase/supabase-js'

/** Singleton-Zeile: manche Setups nutzen id UUID, manche INTEGER 1 */
export const FINANCE_SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000001'

export interface FinanceSettings {
  tax_rate: number
  mollie_fixed: number
  mollie_percent: number
  revenue_limit: number
}

const DEFAULTS: FinanceSettings = {
  tax_rate: 30,
  mollie_fixed: 0.29,
  mollie_percent: 0.25,
  revenue_limit: 22500,
}

/**
 * Zentrale Finanz-Parameter aus Tabelle finance_settings laden.
 * Wird von Dashboard, Webhook und Export genutzt – eine Quelle für alle Berechnungen.
 */
export async function getFinanceSettings(admin: SupabaseClient): Promise<FinanceSettings> {
  const { data } = await admin.from('finance_settings').select('tax_rate, mollie_fixed, mollie_percent, revenue_limit').eq('id', FINANCE_SETTINGS_ROW_ID).maybeSingle()
  if (!data) {
    const { data: fallback } = await admin.from('finance_settings').select('tax_rate, mollie_fixed, mollie_percent, revenue_limit').eq('id', 1).maybeSingle()
    const row = fallback ?? data
    if (!row) return DEFAULTS
    return {
      tax_rate: Number(row.tax_rate) ?? DEFAULTS.tax_rate,
      mollie_fixed: Number(row.mollie_fixed) ?? DEFAULTS.mollie_fixed,
      mollie_percent: Number(row.mollie_percent) ?? DEFAULTS.mollie_percent,
      revenue_limit: Number(row.revenue_limit) ?? DEFAULTS.revenue_limit,
    }
  }
  return {
    tax_rate: Number(data.tax_rate) ?? DEFAULTS.tax_rate,
    mollie_fixed: Number(data.mollie_fixed) ?? DEFAULTS.mollie_fixed,
    mollie_percent: Number(data.mollie_percent) ?? DEFAULTS.mollie_percent,
    revenue_limit: Number(data.revenue_limit) ?? DEFAULTS.revenue_limit,
  }
}

/** Transaktionsgebühr (z. B. Mollie) aus settings berechnen */
export function calcTransactionFee(totalEur: number, settings: FinanceSettings): number {
  return settings.mollie_fixed + (totalEur * settings.mollie_percent) / 100
}

/** Steuerrücklage (z. B. 30 %) vom Gewinn */
export function calcTaxReserve(netProfit: number, settings: FinanceSettings): number {
  return Math.round((netProfit * (settings.tax_rate / 100)) * 100) / 100
}
