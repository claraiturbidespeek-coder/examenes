import { signOut } from "@/app/admin/actions";
import { ClientRows } from "@/app/admin/client-rows";
import type { AdminClient } from "@/app/admin/edit-client-form";
import { NewPageForm } from "@/app/admin/new-page-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Cliente con la sesión del usuario, no service_role: si la sesión no vale,
  // RLS devuelve vacío en vez de exponer la tabla entera.
  const supabase = await createServerSupabaseClient();

  const { data: pages, error } = await supabase
    .from("exam_pages")
    .select("id, client_slug, language, client_name, destination_url, legacy_client_id")
    .order("client_name", { ascending: true })
    .order("language", { ascending: true });

  // La tabla guarda una fila por cliente+idioma, pero el panel se edita por
  // cliente. Se agrupa por client_slug, que es lo que de verdad identifica al
  // cliente: el nombre puede repetirse o cambiar, el slug no.
  const clients = new Map<string, AdminClient>();

  for (const page of pages ?? []) {
    const entry = { id: page.id, language: page.language, destination_url: page.destination_url };
    const group = clients.get(page.client_slug);

    if (group) {
      group.pages.push(entry);
    } else {
      clients.set(page.client_slug, {
        client_slug: page.client_slug,
        client_name: page.client_name,
        legacy_client_id: page.legacy_client_id ?? "",
        pages: [entry],
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6 sm:p-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
            S-Peak
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Páginas de acceso
          </h1>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <div className="mt-8">
        <NewPageForm />
      </div>

      {error ? (
        <p role="alert" className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar las páginas: {error.message}
        </p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Idioma</th>
              <th className="px-4 py-3 font-medium">URL pública</th>
              <th className="px-4 py-3 font-medium">Destino</th>
            </tr>
          </thead>

          {clients.size > 0 ? (
            [...clients.values()].map((client) => (
              <ClientRows key={client.client_slug} client={client} />
            ))
          ) : (
            <tbody>
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-600">
                  Todavía no hay ninguna página. Añade la primera.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </main>
  );
}
