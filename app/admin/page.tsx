import { signOut } from "@/app/admin/actions";
import { ClientsTable } from "@/app/admin/clients-table";
import type { AdminClient } from "@/app/admin/edit-client-form";
import { NewPageForm } from "@/app/admin/new-page-form";
import type { LanguageNodes } from "@/lib/exam-link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Cliente con la sesión del usuario, no service_role: si la sesión no vale,
  // RLS devuelve vacío en vez de exponer la tabla entera.
  const supabase = await createServerSupabaseClient();

  // Las dos consultas son independientes, así que van a la vez.
  const [{ data: pages, error }, { data: languageNodes, error: nodesError }] =
    await Promise.all([
      supabase
        .from("exam_pages")
        .select("id, client_slug, language, client_name, destination_url, legacy_client_id")
        .order("client_name", { ascending: true })
        .order("language", { ascending: true }),
      supabase.from("language_nodes").select("language, node"),
    ]);

  // Idioma -> node. Los formularios lo necesitan para construir el link y para
  // saber qué idiomas todavía no se pueden dar de alta.
  const nodes: LanguageNodes = Object.fromEntries(
    (languageNodes ?? []).map((row) => [row.language, row.node]),
  );

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
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marca:
              no hay nada que optimizar y next/image no procesa SVG local sin
              habilitar dangerouslyAllowSVG. */}
          <img src="/logo_navy.svg" alt="S-Peak" className="w-28" />
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Páginas de acceso
          </h1>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <div className="mt-8">
        <NewPageForm nodes={nodes} />
      </div>

      {error ? (
        <p role="alert" className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar las páginas: {error.message}
        </p>
      ) : null}

      {/* Sin nodes no se puede construir ningún link ni saber qué idiomas están
          disponibles, así que se avisa en vez de dejar el alta medio muerta sin
          explicación. */}
      {nodesError ? (
        <p role="alert" className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los nodes de idioma: {nodesError.message}
        </p>
      ) : null}

      <div className="mt-8">
        <ClientsTable clients={[...clients.values()]} nodes={nodes} />
      </div>
    </main>
  );
}
