import { createClient } from "@supabase/supabase-js";

// ATTENTION : ce client utilise la clé secrète et ne doit JAMAIS être
// importé dans un composant "use client" ou exposé au navigateur.
// Il ne doit être utilisé que dans les routes API (app/api/.../route.ts).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}