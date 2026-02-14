import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_EMAIL = 'jzettl0@gmail.com'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Session auf jeder relevanten Route aktualisieren (getUser refresht Token, getSession nicht)
  const { data: { user } } = await supabase.auth.getUser()
  const session = user ? { user } : null

  // Prüfe ob Route ein Admin-Route ist
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    if (session.user.email !== ADMIN_EMAIL) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  // Session auf allen Seiten refreshen, damit Cookies/Session erhalten bleiben (außer Static/API)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}
