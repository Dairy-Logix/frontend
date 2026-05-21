import { NextResponse } from 'next/server';

// Single-domain deployment: tenant identity comes entirely from the JWT after login.
// No hostname-based tenant extraction, no subdomain rewrites.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
