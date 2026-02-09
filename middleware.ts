import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const { pathname } = req.nextUrl;

    if (!role) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/schools/:path*', '/students/:path*', '/payments/:path*', '/board/:path*', '/admin/:path*']
};
