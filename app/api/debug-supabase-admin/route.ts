import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * Nur für lokale Fehlersuche: Prüft ob Service-Role-Key und URL gesetzt sind
 * und ob Supabase den Key akzeptiert. Unter http://localhost:3000/api/debug-supabase-admin aufrufen.
 * In Production nicht verwenden oder Route entfernen.
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Nur im Development-Modus' }, { status: 404 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const keyRaw = process.env.SUPABASE_SERVICE_ROLE_KEY
  const key = typeof keyRaw === 'string' ? keyRaw.replace(/\r?\n/g, '').trim() : ''
  const keyPresent = !!(key && key !== '' && key.toLowerCase() !== 'undefined')
  const keyLength = keyPresent ? key.length : 0
  const keyStart = keyPresent ? key.slice(0, 20) : ''
  const keyEnd = keyPresent && key.length > 40 ? key.slice(-10) : ''

  const result: Record<string, unknown> = {
    NEXT_PUBLIC_SUPABASE_URL: url || 'nicht gesetzt',
    urlProjektId: url?.match(/https:\/\/([a-z]+)\.supabase\.co/)?.[1] || '?',
    SUPABASE_SERVICE_ROLE_KEY: keyPresent ? `gesetzt (Länge: ${keyLength})` : 'nicht gesetzt oder ungültig',
    keyAnfang: keyPresent ? `${keyStart}...` : '-',
    keyEnde: keyPresent && keyEnd ? `...${keyEnd}` : '-',
    hasSupabaseAdmin: hasSupabaseAdmin(),
    hinweis: 'Vergleiche urlProjektId mit deinem Supabase-Projekt (steht in der URL des Dashboards). Key-Anfang/Ende müssen zum service_role Key im Dashboard passen.',
  }

  if (!keyPresent || !url) {
    return NextResponse.json({
      ...result,
      fehler: 'Key oder URL fehlt. Prüfe .env.local im Projektroot (gleicher Ordner wie package.json). Keine Anführungszeichen um den Key.',
    })
  }

  if (!key.startsWith('eyJ')) {
    return NextResponse.json({
      ...result,
      fehler: 'Der Key beginnt nicht mit "eyJ" – das ist kein gültiger Supabase-Key! In .env.local darf bei SUPABASE_SERVICE_ROLE_KEY nur der KEY stehen (Wert aus Supabase → Settings → API → service_role → Reveal), nicht der Variablenname. Der echte Key beginnt immer mit eyJ...',
    })
  }

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin.from('staff').select('id').limit(1).maybeSingle()
    if (error) {
      return NextResponse.json({
        ...result,
        test: 'Fehler',
        supabaseError: error.message,
        supabaseCode: (error as { code?: string }).code,
        fehler: 'Supabase lehnt den Key ab. Prüfe: 1) Key ist „service_role“, nicht „anon“. 2) URL und Key gehören zum gleichen Supabase-Projekt.',
      })
    }
    return NextResponse.json({
      ...result,
      test: 'OK',
      supabaseErreichbar: true,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      ...result,
      test: 'Exception',
      fehler: msg,
    })
  }
}
