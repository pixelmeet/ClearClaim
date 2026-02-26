import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check auth
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    // Invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // Role Access Control - redirect to role-appropriate dashboard
  if (pathname.startsWith('/admin')) {
    if (payload.role !== UserRole.ADMIN) {
      const redirect =
        payload.role === UserRole.MANAGER ? '/manager' : '/employee/dashboard';
      return NextResponse.redirect(new URL(redirect, request.url));
    }
  }

  if (pathname.startsWith('/manager')) {
    if (payload.role !== UserRole.MANAGER && payload.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/employee/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/employee')) {
    if (payload.role !== UserRole.EMPLOYEE && payload.role !== UserRole.ADMIN) {
      const redirect =
        payload.role === UserRole.MANAGER ? '/manager' : '/employee/dashboard';
      return NextResponse.redirect(new URL(redirect, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/employee/:path*',
    '/dashboard/:path*',
    '/',
  ],
};