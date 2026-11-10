import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  AUTH_ENTRY_PATHS,
  DEFAULT_ROLE,
  defaultWidgetAccess,
  getFallbackRoute,
  getRoutePermission,
  getWidgetSettingsKey,
  hasPermission,
  normalizeRole,
  type Role,
} from '@/lib/auth'

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

  // Penting: jangan hapus - ini akan refresh session jika expired.
  // getUser lebih aman daripada getSession karena validasi ke server.
  const { data: { user } } = await supabase.auth.getUser()

  // Role selalu dibaca dari DB (profiles.role), bukan user_metadata.
  // Guest = tidak ada user, atau role tidak dikenal / migration belum jalan.
  let role: Role = 'guest'
  let isActive = true
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    const profileRow = profile as {
      role?: unknown
      is_active?: unknown
    } | null

    role = error
      ? DEFAULT_ROLE
      : normalizeRole(profileRow?.role, DEFAULT_ROLE)

    // Kalau kolom is_active belum ada / query error, jangan kunci user.
    isActive = error ? true : profileRow?.is_active !== false
  }

  const pathname = request.nextUrl.pathname

  // Akun diblokir/nonaktif hanya boleh melihat halaman /blocked.
  if (user && !isActive) {
    if (pathname === '/blocked') return supabaseResponse

    const url = request.nextUrl.clone()
    url.pathname = '/blocked'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Akun aktif yang membuka /blocked diarahkan kembali ke workspace.
  if (user && isActive && pathname === '/blocked') {
    const url = request.nextUrl.clone()
    url.pathname = getFallbackRoute(role)
    url.search = ''
    return NextResponse.redirect(url)
  }

  const requiredPermission = getRoutePermission(pathname)

  // Lapisan 1: route guard berbasis permission.
  if (requiredPermission && !hasPermission(role, requiredPermission)) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      url.searchParams.set('next', pathname + (request.nextUrl.search || ''))
      return NextResponse.redirect(url)
    }

    // User login tapi rolenya tidak cukup (mis. guest mengakses /account).
    // Redirect ke route yang aman untuk role tsb, hindari loop.
    const fallback = getFallbackRoute(role)
    if (pathname !== fallback) {
      const url = request.nextUrl.clone()
      url.pathname = fallback
      url.search = ''
      url.searchParams.set('denied', requiredPermission)
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // Lapisan 2: akses widget per user (override dari panel admin).
  // Hanya untuk halaman settings `/widgets/<key>`, bukan `/widgets/<key>/display`.
  const widgetKey = getWidgetSettingsKey(pathname)
  if (widgetKey && user && role !== 'admin') {
    const { data: override, error } = await supabase
      .from('user_widget_permissions')
      .select('allowed')
      .eq('user_id', user.id)
      .eq('widget_key', widgetKey)
      .maybeSingle()

    const allowed = error
      ? defaultWidgetAccess(role)
      : override
        ? (override as { allowed?: unknown }).allowed === true
        : defaultWidgetAccess(role)

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/widgets'
      url.search = ''
      url.searchParams.set('denied', `widget.${widgetKey}`)
      return NextResponse.redirect(url)
    }
  }

  // Jika sudah login tapi membuka /login, /register, /forgot-password,
  // redirect ke workspace. /reset-password tetap boleh (session recovery).
  if (user && AUTH_ENTRY_PATHS.includes(pathname)) {
    const next = request.nextUrl.searchParams.get('next')
    const fallback = getFallbackRoute(role)
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
    const url = request.nextUrl.clone()
    url.pathname = safeNext
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
    '/admin/:path*',
    '/dashboard/:path*',
    '/dock/:path*',
    '/account/:path*',
    '/connection/:path*',
    '/config/:path*',
    '/monitor/:path*',
    '/integrations/:path*',
    '/donations/:path*',
    '/overlay/:path*',
    '/widgets/:path*',
    '/designer/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/blocked',
    '/auth/:path*',
  ],
}
