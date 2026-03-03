import type { SupabaseClient } from '@supabase/supabase-js'

/** Store Credit: Guthaben aus Trade-In oder Gutschriften */
export async function getStoreCreditBalance(
  admin: SupabaseClient,
  customerId: string
): Promise<number> {
  const { data } = await admin
    .schema('recommerce')
    .from('store_credit_wallets')
    .select('current_balance')
    .eq('customer_id', customerId)
    .maybeSingle()
  return Number(data?.current_balance ?? 0)
}

/** Wallet erstellen falls nicht vorhanden; Balance setzen oder addieren */
export async function creditStoreWallet(
  admin: SupabaseClient,
  customerId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<{ ok: boolean; newBalance: number; error?: string }> {
  if (amount <= 0) return { ok: false, newBalance: 0, error: 'Amount must be positive' }
  const { data: wallet } = await admin
    .schema('recommerce')
    .from('store_credit_wallets')
    .select('wallet_id, current_balance')
    .eq('customer_id', customerId)
    .maybeSingle()

  let walletId = wallet?.wallet_id
  let currentBalance = Number(wallet?.current_balance ?? 0)

  if (!walletId) {
    const { data: inserted } = await admin
      .schema('recommerce')
      .from('store_credit_wallets')
      .insert({ customer_id: customerId, current_balance: amount })
      .select('wallet_id')
      .single()
    if (!inserted) return { ok: false, newBalance: 0, error: 'Failed to create wallet' }
    walletId = inserted.wallet_id
    currentBalance = amount
  } else {
    currentBalance += amount
    await admin
      .schema('recommerce')
      .from('store_credit_wallets')
      .update({ current_balance: currentBalance, last_updated: new Date().toISOString() })
      .eq('wallet_id', walletId)
  }

  await admin.schema('recommerce').from('store_credit_transactions').insert({
    wallet_id: walletId,
    amount,
    balance_after: currentBalance,
    reason,
    reference_id: referenceId ?? null,
  })
  return { ok: true, newBalance: currentBalance }
}
