import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getWatermarkSettings } from '@/lib/watermark-settings'

export const dynamic = 'force-dynamic'

/** GET – Wasserzeichen-Einstellungen für Admin-UI */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const settings = await getWatermarkSettings(admin)
  return NextResponse.json(settings)
}

/** PATCH – Wasserzeichen-Einstellungen speichern */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const logo_url = typeof body.logo_url === 'string' ? body.logo_url.trim() || null : undefined
  const opacity = typeof body.opacity === 'number' ? Math.min(100, Math.max(0, body.opacity)) : undefined
  const position = ['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center'].includes(body.position)
    ? body.position
    : undefined

  const admin = createSupabaseAdmin()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (logo_url !== undefined) payload.logo_url = logo_url
  if (opacity !== undefined) payload.opacity = opacity
  if (position !== undefined) payload.position = position

  await admin.from('watermark_settings').upsert(
    {
      id: 'default',
      logo_url: payload.logo_url ?? null,
      opacity: payload.opacity ?? 50,
      position: payload.position ?? 'bottom_right',
      updated_at: payload.updated_at,
    },
    { onConflict: 'id' }
  )

  const settings = await getWatermarkSettings(admin)
  return NextResponse.json(settings)
}
