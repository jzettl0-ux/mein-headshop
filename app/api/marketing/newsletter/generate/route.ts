import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SYSTEM_PROMPT = `Du schreibst einen Newsletter für einen High-End Headshop im Stil "Clean Luxe". Der HTML-Code muss für Outlook, Apple Mail und Gmail optimiert sein: nur Tabellen und Inline-Styles, keine Flexbox/Grid/CSS-Klassen.

LAYOUT & TYPOGRAFIE:
- Zwischen Sektionen immer 40px Abstand (z. B. style="margin-bottom: 40px;" auf umschließenden Tabellen oder Zellen).
- Headlines: Serif (Georgia), zentriert, z. B. <h2 style="text-align:center; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; margin: 0 0 24px;">...</h2>
- Fließtext: Sans-Serif, z. B. style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;"

PRODUKT-LOGIK (für jedes Produkt):
- Schreibe einen ansprechenden Text mit maximal 3 Sätzen. Stil: exklusiv, fachkundig, dezent luxuriös. Nutze name, description, price und url aus den JSON-Daten.
- Darstellung pro Produkt in einem sauberen Grid (E-Mail-tauglich mit <table>): 1) Produktbild oben (img mit fester Breite z. B. 200px, height auto), 2) darunter Name in fett (font-weight: bold), 3) darunter Preis in Gold-Optik (color: #D4AF37; font-size: 18px;), 4) darunter ein "Jetzt entdecken"-Button als Link (z. B. <a href="url" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; margin-top: 8px;">Jetzt entdecken</a>).
- Preise formatieren: "29,99 €" (Komma als Dezimaltrenner, Leerzeichen vor dem Euro-Zeichen).

CONTENT-DIREKTIVE:
- Schreibe NIEMALS "Billig", "Rabatt-Schlacht" oder ähnlich. Nutze stattdessen: "Exklusives Angebot", "Kuratiertes Set", "Besonderes Highlight", "Ausgewählte Neuheiten".
- Emojis: maximal ein passendes Icon pro Sektion, dezent. Keine übermäßigen Emojis.

EVENT-MODUS WEIHNACHTLICH:
- Wenn der Nutzer in den Redaktionellen Notizen "weihnachtlich", "Weihnachten" oder "festlich" vorgibt: Tonfall anpassen auf festlich und gemütlich, ohne den Luxus-Vibe zu verlieren. Formulierungen wie "in besinnlicher Zeit", "als besonderes Highlight für die Feiertage" sind erlaubt. Das äußere Design (feine Linien) übernimmt das Template.

Struktur: 1) Kurze Begrüßung. 2) Optional Sektion "Neuheiten" (is_new = true). 3) Optional Sektion "Angebote" oder "Highlights" (on_sale = true). Redaktionelle Notizen unbedingt einarbeiten.
HTML: Nur Inhalt – keine <html>, <body>, <head>. Alle Styles inline. Tabellen für mehrspaltige Produkt-Grids (z. B. <table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="padding: 16px;">...</td><td width="50%" style="padding: 16px;">...</td></tr></table>). Maximal 550 Wörter.`

type NewsletterProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  created_at: string
  is_new_override: boolean
  is_new: boolean
  on_sale: boolean
  discount_text: string | null
  discount_percent: number | null
  discount_until: string | null
}

/**
 * POST – Lädt Produkte (manuell gewählt per product_ids ODER aus View ai_newsletter_data),
 * sendet sie mit Redaktionellen Notizen an die KI und liefert einen edlen HTML-Entwurf.
 * Erfordert OPENAI_API_KEY in .env.
 */
function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return `newsletter-gen:${ip}`
}

function toNewsletterProduct(r: Record<string, unknown>, baseUrl: string): NewsletterProduct & { url: string } {
  const created = r.created_at ? new Date(String(r.created_at)).getTime() : 0
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
  const isNew = Boolean(r.is_new_override) || created >= fourteenDaysAgo
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    slug: String(r.slug ?? ''),
    description: r.description != null ? String(r.description) : null,
    price: Number(r.price ?? 0),
    image_url: r.image_url != null ? String(r.image_url) : null,
    created_at: String(r.created_at ?? ''),
    is_new_override: Boolean(r.is_new_override),
    is_new: isNew,
    on_sale: Boolean(r.on_sale),
    discount_text: r.discount_text != null ? String(r.discount_text) : null,
    discount_percent: r.discount_percent != null ? Number(r.discount_percent) : null,
    discount_until: r.discount_until != null ? String(r.discount_until) : null,
    url: `${baseUrl}/shop/${r.slug ?? ''}`,
  }
}

export async function POST(request: Request) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const rl = checkRateLimit(getClientId(request), 15, 60)
  if (!rl.allowed) return NextResponse.json({ error: 'Zu viele Anfragen. Bitte kurz warten.' }, { status: 429 })

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY ist nicht gesetzt. Bitte in .env.local eintragen.' },
      { status: 503 }
    )
  }

  let editorialNotes = ''
  let productIds: string[] = []
  try {
    const body = await request.json().catch(() => ({}))
    editorialNotes = typeof body.editorial_notes === 'string' ? body.editorial_notes.trim() : (typeof body.special_instructions === 'string' ? body.special_instructions.trim() : '')
    productIds = Array.isArray(body.product_ids) ? body.product_ids.filter((id: unknown): id is string => typeof id === 'string') : []
  } catch {
    // body optional
  }

  const admin = createSupabaseAdmin()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://premium-headshop.de'

  let products: NewsletterProduct[]

  if (productIds.length > 0) {
    const { data: rows, error } = await admin
      .from('products')
      .select('id, name, slug, description, price, image_url, created_at, is_new_override, on_sale, discount_text, discount_percent, discount_until')
      .in('id', productIds)

    if (error) {
      console.error('products by id error:', error)
      return NextResponse.json({ error: 'Produkte konnten nicht geladen werden.' }, { status: 502 })
    }
    products = (rows ?? []).map((r: Record<string, unknown>) => {
      const p = toNewsletterProduct(r, baseUrl)
      const { url, ...rest } = p
      return rest
    })
  } else {
    const { data: rows, error: viewError } = await admin
      .from('ai_newsletter_data')
      .select('*')

    if (viewError) {
      console.error('ai_newsletter_data error:', viewError)
      return NextResponse.json(
        { error: 'Daten für Newsletter konnten nicht geladen werden. View ai_newsletter_data prüfen oder Produkte manuell auswählen.' },
        { status: 502 }
      )
    }
    products = (rows ?? []).map((r: Record<string, unknown>) => {
      const p = toNewsletterProduct(r, baseUrl)
      const { url, ...rest } = p
      return rest
    })
  }

  const productPayload = products.map((p) => ({
    ...p,
    url: `${baseUrl}/shop/${p.slug}`,
  }))

  const userParts = [
    `Produktdaten für den Newsletter (JSON). is_new = Neuheit, on_sale = Angebot, url = Shop-Link:`,
    JSON.stringify(productPayload, null, 2),
    `Shop-Basis-URL: ${baseUrl}.`,
  ]
  if (editorialNotes) {
    userParts.push(`Redaktionelle Notizen (unbedingt einarbeiten – Themen, Rabattcodes, Formulierungen): ${editorialNotes}`)
  }
  const userMessage = userParts.join('\n\n')

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1800,
        temperature: 0.7,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = data?.error?.message || data?.message || res.statusText
      return NextResponse.json({ error: `OpenAI: ${err}` }, { status: 502 })
    }

    const content = data?.choices?.[0]?.message?.content?.trim()
    if (!content) return NextResponse.json({ error: 'Keine Antwort von der KI' }, { status: 502 })

    const newCount = products.filter((p) => p.is_new).length
    const saleCount = products.filter((p) => p.on_sale).length

    return NextResponse.json({
      html: content,
      meta: {
        products_count: products.length,
        new_count: newCount,
        sale_count: saleCount,
      },
    })
  } catch (e) {
    console.error('Newsletter generate error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler bei der KI-Generierung' },
      { status: 500 }
    )
  }
}
