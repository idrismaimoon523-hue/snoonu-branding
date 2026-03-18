import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.cookies.get('snoonu_session');

  // Not authenticated → redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Parse session
  let user: { role: string } | null = null;
  try {
    user = JSON.parse(decodeURIComponent(session.value));
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  // Role-based path guard
  const role = user.role;
  if (pathname.startsWith('/3pl')      && role !== '3PL')      return NextResponse.redirect(new URL('/login', req.url));
  if (pathname.startsWith('/admin')    && role !== 'Admin')    return NextResponse.redirect(new URL('/login', req.url));
  if (pathname.startsWith('/supplier') && role !== 'Supplier') return NextResponse.redirect(new URL('/login', req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
