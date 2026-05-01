import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createComercialClient() {
  return createSupabaseClient(
    process.env.COMERCIAL_SUPABASE_URL!,
    process.env.COMERCIAL_SUPABASE_ANON_KEY!
  );
}
