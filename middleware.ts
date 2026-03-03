import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Session-Cookie: kein maxAge = Abmeldung beim Schließen des Browsers. Optional: SESSION_MAX_AGE_MINUTES für Abmeldung nach Inaktivität. */
function getSessionCookieOptions(): { path: string; sameSite: 'lax'; maxAge?: number } {
  const path = '/'
  const sameSite = 'lax'
  const minutes = process.env.SESSION_MAX_AGE_MINUTES ? parseInt(process.env.SESSION_MAX_AGE_MINUTES, 10) : NaN
  if (Number.isFinite(minutes) && minutes > 0) {
    return { path, sameSite, maxAge: minutes * 60 }
  }
  return { path, sameSite }
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('[middleware] NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt – Session-Refresh übersprungen')
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  try {
    const cookieOpts = getSessionCookieOptions()
    const supabase = createServerClient(url, key, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          const opts = { ...options, ...cookieOpts }
          req.cookies.set({ name, value, ...opts })
          response.cookies.set({ name, value, ...opts })
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    // Session auf jeder relevanten Route aktualisieren (getUser refresht Token, getSession nicht)
    const { data: { user } } = await supabase.auth.getUser()
    const session = user ? { user } : null

    // Admin: Session erforderlich
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        const redirectUrl = new URL('/auth', req.url)
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Vendor-Portal: Session erforderlich (Vendor-Check erfolgt im Layout/API)
    if (req.nextUrl.pathname.startsWith('/vendor')) {
      if (!session) {
        const redirectUrl = new URL('/auth', req.url)
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }
  } catch (err) {
    console.warn('[middleware] Supabase Session-Fehler, fahre ohne Session fort:', err)
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  // Session auf allen Seiten refreshen, damit Cookies/Session erhalten bleiben (außer Static/API)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}
