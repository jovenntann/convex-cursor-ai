import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Store the current URL
  const url = request.nextUrl.clone();

  // Check if the path is a dashboard path
  if (url.pathname.startsWith('/dashboard')) {
    // We'll use client-side redirect in the actual dashboard component
    // This is just a fallback
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
}; 