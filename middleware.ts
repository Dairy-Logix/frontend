import { NextRequest, NextResponse } from 'next/server';

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'dairylogics.com';
const ADMIN_SUBDOMAIN = 'admin';

export type TenantContext = 'super_admin' | 'tenant' | 'marketing';

function extractTenantFromHostname(hostname: string): { context: TenantContext; slug: string | null } {
  // Remove port for local development
  const host = hostname.split(':')[0];

  // Local development: localhost
  if (host === 'localhost' || host === '127.0.0.1') {
    return { context: 'marketing', slug: null };
  }

  // Check if it's a subdomain of the main domain
  if (host.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = host.replace(`.${MAIN_DOMAIN}`, '');

    if (subdomain === ADMIN_SUBDOMAIN) {
      return { context: 'super_admin', slug: null };
    }

    if (subdomain && subdomain !== 'www') {
      return { context: 'tenant', slug: subdomain };
    }
  }

  // Bare domain (dairylogics.com or www.dairylogics.com)
  if (host === MAIN_DOMAIN || host === `www.${MAIN_DOMAIN}`) {
    return { context: 'marketing', slug: null };
  }

  return { context: 'marketing', slug: null };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || 'localhost:3000';

  // Allow static files and API routes to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For local dev: check ?tenant= query param or x-tenant-slug header
  let { context, slug } = extractTenantFromHostname(hostname);

  const isLocalDev = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  if (isLocalDev) {
    const tenantParam = request.nextUrl.searchParams.get('tenant');
    const tenantCookie = request.cookies.get('tenant-slug')?.value;

    if (tenantParam === 'admin') {
      context = 'super_admin';
      slug = null;
    } else if (tenantParam) {
      context = 'tenant';
      slug = tenantParam;
    } else if (tenantCookie === 'admin') {
      context = 'super_admin';
      slug = null;
    } else if (tenantCookie) {
      context = 'tenant';
      slug = tenantCookie;
    }
  }

  const headers = new Headers(request.headers);
  headers.set('x-tenant-context', context);
  if (slug) {
    headers.set('x-tenant-slug', slug);
  }

  const response = NextResponse.next({
    request: { headers },
  });

  // Persist tenant slug in cookie for local dev
  if (isLocalDev) {
    const tenantParam = request.nextUrl.searchParams.get('tenant');
    if (tenantParam) {
      response.cookies.set('tenant-slug', tenantParam, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
  }

  response.headers.set('x-tenant-context', context);
  if (slug) {
    response.headers.set('x-tenant-slug', slug);
  }

  // Rewrite admin subdomain requests to /admin/* path prefix
  if (context === 'super_admin') {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/auth') && pathname !== '/') {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url, {
        request: { headers },
      });
    }
  }

  if (context === 'tenant' && !slug) {
    // Unknown tenant - redirect to main site
    if (!isLocalDev) {
      return NextResponse.redirect(new URL(`https://${MAIN_DOMAIN}`));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
