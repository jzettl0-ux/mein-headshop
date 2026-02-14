import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'jzettl0@gmail.com'
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

/** GET – öffentlich, für Branding-Farben im Frontend. Alle branding_* Keys werden als Palette zurückgegeben. */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')

    if (error) {
      return NextResponse.json(DEFAULT_BRANDING, { status: 200 })
    }

    const branding: Record<string, string> = { ...DEFAULT_BRANDING }
    let logo_url: string | undefined
    if (data) {
      for (const row of data) {
        if (row.key.startsWith('branding_')) {
          const shortKey = row.key.replace(/^branding_/, '')
          branding[shortKey] = row.value
        }
        if (row.key === 'logo_url') logo_url = row.value
      }
    }
    return NextResponse.json({ ...branding, logo_url })
  } catch {
    return NextResponse.json(DEFAULT_BRANDING, { status: 200 })
  }
}

/** POST – nur Admin, zum Speichern der Branding-Farben */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as Record<string, string>
    for (const [shortKey, value] of Object.entries(body)) {
      if (value == null || shortKey === '') continue
      const dbKey = shortKey === 'logo_url' ? 'logo_url' : (shortKey.startsWith('branding_') ? shortKey : `branding_${shortKey}`)
      const strValue = String(value)
      if (dbKey === 'logo_url') {
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
