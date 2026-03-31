import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVE_COOKIE = 'bus-last-active';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Check inactivity timeout
  if (user) {
    const lastActive = request.cookies.get(LAST_ACTIVE_COOKIE)?.value;
    const now = Date.now();
    if (lastActive) {
      const ts = parseInt(lastActive, 10);
      if (isNaN(ts)) {
        // 쿠키 손상 시 재설정
        response.cookies.set(LAST_ACTIVE_COOKIE, String(Date.now()), {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      } else if (now - ts > INACTIVITY_TIMEOUT_MS) {
        // Inactivity timeout - sign out and redirect
        await supabase.auth.signOut();
        const loginUrl = new URL('/login?reason=inactive', request.url);
        const logoutResponse = NextResponse.redirect(loginUrl);
        logoutResponse.cookies.delete(LAST_ACTIVE_COOKIE);
        return logoutResponse;
      }
    }
    // Update last active timestamp
    response.cookies.set(LAST_ACTIVE_COOKIE, String(now), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      secure: process.env.NODE_ENV === 'production'
    });
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = user.app_metadata?.role as string | undefined;

  // Admin-only route protection
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/schools/:path*',
    '/students/:path*',
    '/payments/:path*',
    '/board/:path*',
    '/admin/:path*'
  ]
};
