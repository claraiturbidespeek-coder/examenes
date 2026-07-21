import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Cliente con service_role: salta RLS.
 *
 * Lo usa únicamente la página pública del alumno, que necesita leer una fila sin
 * que haya ninguna sesión. El import de "server-only" hace que el build falle si
 * este módulo acaba alcanzable desde un Client Component — la service_role key
 * nunca debe llegar al navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Copia .env.example a .env.local.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
