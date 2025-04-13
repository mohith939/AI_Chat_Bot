import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Check if Supabase environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase credentials are not properly set, just proceed without auth checks
    console.warn('Supabase credentials not properly configured');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            try {
              const cookie = request.cookies.get(name);
              return cookie?.value;
            } catch (error) {
              console.error(`Error getting cookie ${name} in middleware:`, error);
              return undefined;
            }
          },
          set(name, value, options) {
            try {
              response.cookies.set({
                name,
                value,
                ...options,
              });
            } catch (error) {
              console.error(`Error setting cookie ${name} in middleware:`, error);
            }
          },
          remove(name, options) {
            try {
              response.cookies.set({
                name,
                value: '',
                ...options,
              });
            } catch (error) {
              console.error(`Error removing cookie ${name} in middleware:`, error);
            }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Auth routes handling
    if (!session) {
      // If user is not authenticated and trying to access protected routes
      if (
        request.nextUrl.pathname.startsWith('/chat') ||
        request.nextUrl.pathname === '/profile'
      ) {
        return NextResponse.redirect(new URL('/signin', request.url));
      }
    } else {
      // If user is authenticated and trying to access auth routes
      if (
        request.nextUrl.pathname === '/signin' ||
        request.nextUrl.pathname === '/signup'
      ) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch (error) {
    console.error('Error in middleware:', error);
    // In case of error, just proceed without auth checks
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    '/signin',
    '/signup',
    // Temporarily disable middleware for other routes
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};
