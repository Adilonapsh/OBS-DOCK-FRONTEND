import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

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

  // Penting: jangan hapus - ini akan refresh session jika expired
  // getUser lebih aman daripada getSession karena validasi ke server
  const { data: { user } } = await supabase.auth.getUser()

  // Proteksi halaman yang butuh login - redirect ke /login jika belum auth
  // Kecuali allow guest untuk /dock dan /overlay/display & /widgets/display (browser source)
  const protectedPaths = ['/dashboard', '/dock', '/account', '/config', '/monitor', '/integrations']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'))
  const isGuestAllowed = request.nextUrl.pathname.startsWith('/dock') // dock boleh guest via privateKey
    || request.nextUrl.pathname.startsWith('/overlay/display')
    || request.nextUrl.pathname.startsWith('/widgets/display')

  // Jika akses protected tapi tidak ada user dan tidak ada guest key, redirect ke login
  // Untuk /dock kita izinkan guest jika ada privateKey di query atau cookie session guest
  if (isProtected && !user) {
    // cek apakah ada guest_private_key di cookie/sessionStorage tidak bisa diakses di middleware
    // jadi untuk /dock kita tidak paksa redirect - biarkan client yang handle privateKey verification
    if (isGuestAllowed) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // simpan next param biar bisa balik setelah login
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Jika sudah login tapi akses /login, /register, atau /forgot-password, redirect ke dashboard
  // Catatan: /reset-password TIDAK dimasukkan - user yang klik link recovery
  // memang punya session sementara dan harus bisa buka halaman itu.
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/forgot-password') && user) {
    const next = request.nextUrl.searchParams.get('next') || '/dashboard'
    const url = request.nextUrl.clone()
    url.pathname = next
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export default proxy

export const config = {
  // Hanya jalankan middleware di route yang butuh auth - jangan di _next/static/chunks
  // Matcher lama pakai negative lookahead kadang kelewat di Windows/turbopack dan bikin 403
  matcher: [
    '/dashboard/:path*',
    '/dock/:path*',
    '/account/:path*',
    '/config/:path*',
    '/monitor/:path*',
    '/integrations/:path*',
    '/overlay/:path*',
    '/widgets/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/:path*',
  ],
}
