import type { SupabaseClient } from '@supabase/supabase-js'

export interface PolicyViolation {
  policy_id: string
  policy_type: 'ORDER_LIMIT' | 'RESTRICTED_CATEGORY' | 'PREFERRED_VENDOR'
  action_on_violation: 'BLOCK' | 'REQUIRE_APPROVAL' | 'WARN_ONLY'
  policy_value?: number
  target_category_id?: string
  target_vendor_id?: string
}

export interface B2BPolicyCheckResult {
  ok: boolean
  violation?: PolicyViolation
  blockReason?: string
  requireApproval?: boolean
}

interface ValidatedItem {
  product_id: string
  quantity: number
  price: number
  vendor_id?: string | null
  category?: string
}

/**
 * Prüft B2B-Einkaufsrichtlinien gegen eine Bestellung.
 * Gibt die erste Verletzung zurück, die BLOCK oder REQUIRE_APPROVAL auslöst.
 */
export async function checkB2BPolicies(
  admin: SupabaseClient,
  b2bAccountId: string,
  total: number,
  items: ValidatedItem[],
  categoryByProduct?: Map<string, string>
): Promise<B2BPolicyCheckResult> {
  const { data: policies } = await admin
    .schema('b2b')
    .from('purchasing_policies')
    .select('policy_id, policy_type, policy_value, target_category_id, target_vendor_id, action_on_violation')
    .eq('b2b_account_id', b2bAccountId)
    .eq('is_active', true)

  if (!policies?.length) return { ok: true }

  for (const p of policies) {
    let violated = false

    if (p.policy_type === 'ORDER_LIMIT' && p.policy_value != null) {
      violated = total > Number(p.policy_value)
    } else if (p.policy_type === 'RESTRICTED_CATEGORY' && p.target_category_id) {
      const { data: catRow } = await admin.from('product_categories').select('id, slug').eq('id', p.target_category_id).maybeSingle()
      const restrictedSlug = (catRow as { slug?: string })?.slug
      const { data: prods } = await admin.from('products').select('id, category').in('id', items.map((i) => i.product_id))
      const prodCatMap = new Map((prods ?? []).map((pc: { id: string; category: string }) => [pc.id, pc.category]))
      violated = restrictedSlug ? items.some((item) => prodCatMap.get(item.product_id) === restrictedSlug) : false
    } else if (p.policy_type === 'PREFERRED_VENDOR' && p.target_vendor_id) {
      const preferred = p.target_vendor_id
      violated = items.some((item) => item.vendor_id && item.vendor_id !== preferred)
    }

    if (violated) {
      const action = (p.action_on_violation as 'BLOCK' | 'REQUIRE_APPROVAL' | 'WARN_ONLY') || 'REQUIRE_APPROVAL'
      const v: PolicyViolation = {
        policy_id: p.policy_id,
        policy_type: p.policy_type as PolicyViolation['policy_type'],
        action_on_violation: action,
        policy_value: p.policy_value != null ? Number(p.policy_value) : undefined,
        target_category_id: p.target_category_id ?? undefined,
        target_vendor_id: p.target_vendor_id ?? undefined,
      }
      if (action === 'BLOCK') {
        const msg = p.policy_type === 'ORDER_LIMIT'
          ? `Bestelllimit von ${Number(p.policy_value).toFixed(2)} € überschritten.`
          : p.policy_type === 'RESTRICTED_CATEGORY'
            ? 'Eine oder mehrere Kategorien sind durch Ihre Einkaufsrichtlinie eingeschränkt.'
            : 'Nur bestimmte Anbieter sind durch Ihre Einkaufsrichtlinie erlaubt.'
        return { ok: false, violation: v, blockReason: msg }
      }
      if (action === 'REQUIRE_APPROVAL') {
        return { ok: false, violation: v, requireApproval: true }
      }
    }
  }

  return { ok: true }
}
