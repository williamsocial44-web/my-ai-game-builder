import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client for Client Components.
 * Reads the same public env vars the rest of the app uses.
 * Returns null if env vars are missing so the UI can degrade gracefully.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
