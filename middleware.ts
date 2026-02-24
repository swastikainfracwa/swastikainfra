import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/plots',
    '/about',
    '/contact',
    '/login',
    '/signup',
    '/reset-password',
    '/privacy',
    '/terms',
  ];

  // Check if it's a plot detail page (dynamic route)
  const isPlotDetailPage = pathname.startsWith('/plots/') && pathname !== '/plots';

  // Get NextAuth session token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Handle root path ('/') - redirect staff users to their dashboard
  // Owners and regular users can access the home page
  if (pathname === '/' && token) {
    const userRole = token.role as string;
    const url = request.nextUrl.clone();
    
    // Only redirect staff to their dashboards
    if (userRole === 'admin') {
      url.pathname = '/admin';
    } else if (userRole === 'manager') {
      url.pathname = '/manager';
    } else if (userRole === 'agent') {
      url.pathname = '/agent';
    } else if (userRole === 'business_partner') {
      url.pathname = '/business-partner';
    }
    // Owners stay on home page and can access their dashboard via navigation
    
    // Only redirect if we have a valid role and pathname changed
    if (url.pathname !== '/') {
      return NextResponse.redirect(url);
    }
  }

  // Allow access to public routes, plot detail pages, and API routes
  if (publicRoutes.includes(pathname) || isPlotDetailPage || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const userRole = token.role as string;

  // Role-based access control
  const roleRoutes: Record<string, string[]> = {
    '/dashboard': ['owner'],
    '/agent': ['agent'],
    '/manager': ['manager', 'admin'],
    '/admin': ['admin'],
    '/business-partner': ['business_partner'],
  };

  // Check if the route requires specific roles
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const url = request.nextUrl.clone();
        if (userRole === 'owner') {
          url.pathname = '/dashboard';
        } else if (userRole === 'agent') {
          url.pathname = '/agent';
        } else if (userRole === 'manager') {
          url.pathname = '/manager';
        } else if (userRole === 'admin') {
          url.pathname = '/admin';
        } else if (userRole === 'business_partner') {
          url.pathname = '/business-partner';
        } else {
          url.pathname = '/';
        }
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, robots.txt, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};

