import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

// Sin caché: cuando el equipo añade o cambia una página en el admin, el enlace
// que ya se repartió a los alumnos debe reflejarlo en la siguiente carga.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ client: string; language: string }>;
};

export default async function ExamAccessPage({ params }: PageProps) {
  const { client, language } = await params;

  const supabase = createAdminClient();
  const { data: examPage, error } = await supabase
    .from("exam_pages")
    .select("client_name, destination_url")
    .eq("client_slug", client.toLowerCase())
    .eq("language", language.toLowerCase())
    .maybeSingle();

  if (error) {
    // Un fallo de base de datos no es una página inexistente. Se distingue para
    // que un incidente de Supabase no se lea como "este cliente no existe".
    throw new Error(`No se pudo consultar exam_pages: ${error.message}`);
  }

  if (!examPage) {
    notFound();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          S-Peak
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
          {examPage.client_name}
        </h1>

        <p className="mt-2 text-sm text-neutral-600">
          Tu examen está listo. Pulsa el botón para acceder.
        </p>

        <a
          href={examPage.destination_url}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Ir a mi examen
        </a>
      </div>
    </main>
  );
}
