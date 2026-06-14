import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Next 16 renamed Middleware to "Proxy" (root proxy.js, Node.js runtime).
 * This refreshes the Supabase auth session on each request so server
 * components and route handlers always see a valid session cookie.
 */
export async function proxy(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Without Supabase configured there is nothing to refresh.
  if (!url || !key) return response;

  // No Supabase auth cookie means no session to refresh — skip the network
  // round-trip entirely so anonymous requests stay fast.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touch the session so expired access tokens get refreshed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
