import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Menukar `code` dari link email Supabase (recovery / signup / magic link)
// menjadi session cookie, lalu redirect ke halaman `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'

  // OAuth Google dibatalkan/gagal (mis. user menekan kembali / provider belum aktif)
  // -> Supabase redirect ke sini dengan ?error=... tanpa code.
  if (!code && searchParams.get('error')) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'oauth')
    return NextResponse.redirect(url)
  }

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}${next}`)
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
  return NextResponse.redirect(url)
}
