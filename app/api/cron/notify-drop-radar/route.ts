/**
 * GET /api/cron/notify-drop-radar?secret=CRON_SECRET
 * Blueprint Drop-Radar: Sendet E-Mails an Abonnenten, deren Wunschprodukt wieder auf Lager ist.
 * Nur Produkte mit stock > 0; Abonnenten mit is_notified=false, notification_channel='EMAIL'.
 * Vercel Cron: z. B. alle 30 Min.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendDropRadarRestockEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  // Abonnenten mit Produkten, die wieder auf Lager sind (stock > 0)
  const { data: subs, error: subsError } = await admin
    .schema('gamification')
    .from('drop_radar_subscriptions')
    .select(`
      subscription_id,
      product_id,
      email
    `)
    .eq('notification_channel', 'EMAIL')
    .eq('is_notified', false)
    .not('email', 'is', null)

  if (subsError || !subs?.length) {
    return NextResponse.json({
      ok: true,
      notified: 0,
      message: 'Keine Drop-Radar-Abonnenten zu benachrichtigen.',
    })
  }

  const productIds = [...new Set(subs.map((s) => s.product_id))]
  const { data: products } = await admin
    .from('products')
    .select('id, name, slug, price, image_url, images')
    .in('id', productIds)
    .gt('stock', 0)

  if (!products?.length) {
    return NextResponse.json({
      ok: true,
      notified: 0,
      message: 'Keine Produkte mit Lagerbestand unter den Abonnenten.',
    })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))
  let notified = 0
  const errors: string[] = []

  for (const sub of subs as { subscription_id: string; product_id: string; email: string }[]) {
    const product = productMap.get(sub.product_id)
    if (!product || !sub.email?.trim()) continue

    const imageUrl =
      product.image_url ||
      (Array.isArray(product.images) && product.images[0]
        ? String(product.images[0])
        : null)

    const { ok, error } = await sendDropRadarRestockEmail({
      to: sub.email.trim(),
      productName: product.name,
      productSlug: product.slug,
      productImageUrl: imageUrl,
      productPrice: product.price ? Number(product.price) : null,
    })

    if (ok) {
      notified++
      await admin
        .schema('gamification')
        .from('drop_radar_subscriptions')
        .update({ is_notified: true })
        .eq('subscription_id', sub.subscription_id)
    } else if (error) {
      errors.push(`${sub.email}: ${error}`)
    }
  }

  return NextResponse.json({
    ok: true,
    notified,
    errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    message: `Drop-Radar: ${notified} Benachrichtigungen versendet.`,
  })
}
