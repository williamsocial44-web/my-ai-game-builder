import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. In Next 16 `cookies()` is async, so this factory is async.
 * Returns null if env vars are missing.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In a Server Component the cookie store is read-only; the proxy
        // refreshes the session instead, so swallow the resulting error.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* called from a Server Component — safe to ignore */
        }
      },
    },
  });
}
