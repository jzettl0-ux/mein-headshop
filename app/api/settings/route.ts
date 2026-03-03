import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'

const DEFAULT_KEYS = ['primary', 'accent', 'charcoal', 'black', 'gray', 'silver'] as const
const DEFAULT_BRANDING: Record<string, string> = {
  primary: '#D4AF37',
  accent: '#39FF14',
  charcoal: '#1A1A1A',
  black: '#0A0A0A',
  gray: '#2A2A2A',
  silver: '#8A8A8A',
}

export const dynamic = 'force-dynamic'

const DEFAULT_RESPONSE = { ...DEFAULT_BRANDING, logo_url: undefined as string | undefined, homepage_influencer_limit: 6 }

/** GET – öffentlich, für Branding-Farben im Frontend. Gibt bei Fehler immer 200 mit Defaults zurück. */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')

    if (error) {
      return NextResponse.json(DEFAULT_RESPONSE, { status: 200 })
    }

    const branding: Record<string, string> = { ...DEFAULT_BRANDING }
    let logo_url: string | undefined
    let homepage_influencer_limit: number = 6
    if (data) {
      for (const row of data) {
        if (row.key?.startsWith('branding_')) {
          const shortKey = row.key.replace(/^branding_/, '')
          branding[shortKey] = row.value
        }
        if (row.key === 'logo_url') logo_url = row.value
        if (row.key === 'homepage_influencer_limit') {
          const n = parseInt(row.value, 10)
          if (!Number.isNaN(n) && n >= 0) homepage_influencer_limit = n
        }
      }
    }
    return NextResponse.json({ ...branding, logo_url, homepage_influencer_limit })
  } catch {
    return NextResponse.json(DEFAULT_RESPONSE, { status: 200 })
  }
}

/** POST – nur Admin, zum Speichern der Branding-Farben */
export async function POST(req: Request) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const body = (await req.json()) as Record<string, string | number>
    for (const [shortKey, value] of Object.entries(body)) {
      if (value == null || shortKey === '') continue
      const dbKey = shortKey === 'logo_url' ? 'logo_url' : shortKey === 'homepage_influencer_limit' ? 'homepage_influencer_limit' : (shortKey.startsWith('branding_') ? shortKey : `branding_${shortKey}`)
      const strValue = String(value)
      if (dbKey === 'logo_url' || dbKey === 'homepage_influencer_limit') {
        await supabase.from('site_settings').upsert({ key: dbKey, value: strValue }, { onConflict: 'key' })
      } else if (strValue) {
        await supabase.from('site_settings').upsert({ key: dbKey, value: strValue }, { onConflict: 'key' })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
