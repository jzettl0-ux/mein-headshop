import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext, requireAdmin } from '@/lib/admin-auth'

/** GET – Metriken zu einem A/B-Experiment (Impressions, Clicks, Purchases pro Variante) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ metrics: [] })

  const { id: experiment_id } = await params
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('marketing')
    .from('ab_experiment_metrics')
    .select('*')
    .eq('experiment_id', experiment_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ metrics: data ?? [] })
}

/** POST – Metrik erhöhen (impression, click, purchase). Body: variant_assigned: "A"|"B", event: "impression"|"click"|"purchase" */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id: experiment_id } = await params
  const body = await request.json().catch(() => ({}))
  const variant = ['A', 'B'].includes(body.variant_assigned) ? body.variant_assigned : null
  const event = ['impression', 'click', 'purchase'].includes(body.event) ? body.event : null
  if (!variant || !event) {
    return NextResponse.json({ error: 'variant_assigned (A|B) und event (impression|click|purchase) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const col = event === 'impression' ? 'impressions_count' : event === 'click' ? 'clicks_count' : 'purchases_count'

  const { data: existing } = await admin
    .schema('marketing')
    .from('ab_experiment_metrics')
    .select('metric_id, impressions_count, clicks_count, purchases_count')
    .eq('experiment_id', experiment_id)
    .eq('variant_assigned', variant)
    .maybeSingle()

  if (existing) {
    const current = existing as { metric_id: string; impressions_count: number; clicks_count: number; purchases_count: number }
    const newVal = (current as Record<string, number>)[col] + 1
    const { error: updErr } = await admin
      .schema('marketing')
      .from('ab_experiment_metrics')
      .update({ [col]: newVal, last_updated: new Date().toISOString() })
      .eq('metric_id', current.metric_id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  } else {
    const { error: insErr } = await admin
      .schema('marketing')
      .from('ab_experiment_metrics')
      .insert({
        experiment_id,
        variant_assigned: variant,
        impressions_count: event === 'impression' ? 1 : 0,
        clicks_count: event === 'click' ? 1 : 0,
        purchases_count: event === 'purchase' ? 1 : 0,
      })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, event, variant })
}
