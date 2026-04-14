import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no browser (Client Components).
 * Chame esta função em qualquer componente client-side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
