import { signOut } from "@/app/admin/actions";
import { NewPageForm } from "@/app/admin/new-page-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Cliente con la sesión del usuario, no service_role: si la sesión no vale,
  // RLS devuelve vacío en vez de exponer la tabla entera.
  const supabase = await createServerSupabaseClient();

  const { data: pages, error } = await supabase
    .from("exam_pages")
    .select("id, client_slug, language, client_name, destination_url")
    .order("client_name", { ascending: true })
    .order("language", { ascending: true });

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
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">URL pública</th>
              <th className="px-4 py-3 font-medium">Destino</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pages?.length ? (
              pages.map((page) => (
                <tr key={page.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {page.client_name}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/${page.client_slug}/${page.language}`}
                      className="font-mono text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                    >
                      /{page.client_slug}/{page.language}
                    </a>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-neutral-600">
                    {page.destination_url}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-600">
                  Todavía no hay ninguna página. Añade la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
