import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/widget/embed.js?apiKey=xxx
 * Liefert JS-Snippet für Buy-With-Widget. Prüft apiKey + Referer gegen domain_whitelist.
 */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return new NextResponse('console.error("Widget: Service nicht verfügbar");', {
      status: 503,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    })
  }

  const apiKey = request.nextUrl.searchParams.get('apiKey')
  const referer = request.headers.get('referer') ?? ''
  const host = referer ? (() => { try { return new URL(referer).host; } catch { return ''; } })() : ''

  if (!apiKey) {
    return new NextResponse(
      'console.error("Widget: apiKey fehlt – z.B. script src=\\".../api/widget/embed.js?apiKey=KEY\\"");',
      { status: 400, headers: { 'Content-Type': 'application/javascript; charset=utf-8' } }
    )
  }

  const admin = createSupabaseAdmin()
  const { data: row, error } = await admin
    .schema('external_commerce')
    .from('widget_deployments')
    .select('widget_id, domain_whitelist, status')
    .eq('public_api_key', apiKey)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (error || !row) {
    return new NextResponse('console.error("Widget: Ungültiger API-Key");', {
      status: 401,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    })
  }

  const allowedDomains = (row.domain_whitelist || '')
    .split(',')
    .map((d: string) => d.trim().toLowerCase())
    .filter(Boolean)
  const allowed = host && allowedDomains.some((d: string) => host === d || host.endsWith('.' + d))

  if (!allowed) {
    return new NextResponse('console.error("Widget: Domain nicht in Whitelist");', {
      status: 403,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const js = `
(function() {
  var apiKey = "${apiKey.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
  var baseUrl = "${baseUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
  window.BuyWithWidget = window.BuyWithWidget || {
    apiKey: apiKey,
    baseUrl: baseUrl,
    openCheckout: function(cart) {
      var url = baseUrl + "/checkout?widget=1&apiKey=" + encodeURIComponent(apiKey);
      if (cart && cart.items && cart.items.length) {
        url += "&cart=" + encodeURIComponent(JSON.stringify(cart));
      }
      window.open(url, "_blank", "noopener");
    }
  };
  if (typeof document.dispatchEvent === "function") {
    document.dispatchEvent(new CustomEvent("BuyWithWidgetReady", { detail: window.BuyWithWidget }));
  }
})();
`.trim()

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
