/**
 * Blueprint Teil 7.22: Pre-Index Compliance Filter (CanG-Wächter)
 * Prüft Produkttexte gegen Verbots-Keywords bevor Veröffentlichung.
 */
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export type PercolateAction = 'BLOCK' | 'FLAG_FOR_REVIEW'

export async function checkPercolateRules(
  text: string,
  categoryId?: string | null
): Promise<{ blocked: boolean; flagged: boolean; matchedKeywords: string[] }> {
  if (!hasSupabaseAdmin()) return { blocked: false, flagged: false, matchedKeywords: [] }
  const admin = createSupabaseAdmin()
  const { data: rules } = await admin
    .schema('catalog_defense')
    .from('percolate_rules')
    .select('illegal_keyword, action, category_context')
  if (!rules?.length) return { blocked: false, flagged: false, matchedKeywords: [] }
  const textLower = (text || '').toLowerCase()
  const matched: string[] = []
  let blocked = false
  let flagged = false
  for (const r of rules as { illegal_keyword: string; action: string; category_context?: string }[]) {
    const kw = (r.illegal_keyword || '').toLowerCase()
    if (!kw || !textLower.includes(kw)) continue
    if (r.category_context && categoryId && r.category_context !== categoryId) continue
    matched.push(r.illegal_keyword)
    if (r.action === 'BLOCK') blocked = true
    if (r.action === 'FLAG_FOR_REVIEW') flagged = true
  }
  return { blocked, flagged, matchedKeywords: [...new Set(matched)] }
}
