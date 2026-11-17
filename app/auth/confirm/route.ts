import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Tujuan setelah login: prioritaskan ?next= (link email recovery), lalu
// cookie `oauth_next` yang diset GoogleAuthButton, lalu default.
// Hanya path internal yang diterima supaya tidak jadi open redirect.
function resolveNext(value: string | undefined): string {
  if (!value) return '/dashboard'
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    // nilai tidak valid -> pakai default
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/dashboard'
  return decoded
}

// Menukar `code` dari link email Supabase (recovery / signup / magic link)
// maupun callback OAuth Google menjadi session cookie, lalu redirect ke `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = resolveNext(
    searchParams.get('next') ??
      request.cookies.get('oauth_next')?.value ??
      undefined
  )

  // OAuth Google dibatalkan/gagal (mis. user menekan kembali / provider belum aktif)
  // -> Supabase redirect ke sini dengan ?error=... tanpa code.
  // Detail asli (error_code / error_description) diteruskan agar tidak tertutup
  // pesan generik dan gampang dilacak di Dashboard -> Logs -> Auth.
  if (!code && searchParams.get('error')) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'oauth')
    const errorCode = searchParams.get('error_code') ?? searchParams.get('error')
    const errorDesc = searchParams.get('error_description')
    if (errorCode) url.searchParams.set('error_code', errorCode)
    if (errorDesc) url.searchParams.set('error_description', errorDesc)
    const response = NextResponse.redirect(url)
    response.cookies.set('oauth_next', '', { path: '/', maxAge: 0 })
    return response
  }

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}${next}`)
    // Cookie tujuan hanya sekali pakai.
    supabaseResponse.cookies.set('oauth_next', '', { path: '/', maxAge: 0 })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return supabaseResponse
  }

  // code tidak valid / expired -> arahkan ke forgot-password dengan pesan
  const url = new URL('/forgot-password', origin)
  url.searchParams.set('error', 'expired')
  const response = NextResponse.redirect(url)
  response.cookies.set('oauth_next', '', { path: '/', maxAge: 0 })
  return response
}
