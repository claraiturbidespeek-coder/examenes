import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { InstructionsCarousel } from "@/app/[client]/[language]/instructions-carousel";
import { INSTRUCTION_STEPS } from "@/lib/exam-instructions";
import { LANGUAGES } from "@/lib/languages";
import { createAdminClient } from "@/lib/supabase/admin";

// La fuente se carga aquí y no en el layout raíz: el panel de admin no la usa y
// no hay razón para que cargue una tipografía que no muestra.
const montserrat = Montserrat({ subsets: ["latin"], display: "swap" });

const NAVY = "#1A3C4D";
const RED = "#B51E40";

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
    .select("client_name, destination_url, language")
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

  const languageLabel =
    LANGUAGES.find((l) => l.code === examPage.language)?.label ?? examPage.language;

  return (
    // h-screen + overflow-hidden: la pantalla se resuelve sin scroll vertical,
    // como en el wireframe. El reparto interno lo hace flexbox.
    <div
      className={`${montserrat.className} h-screen w-screen overflow-hidden p-8`}
      style={{ background: "#ECEAE4" }}
    >
      <div className="flex h-full gap-6">
        {/* ---------- Tarjeta izquierda: saludo y acceso ---------- */}
        <section className="flex flex-[0_0_40%] flex-col gap-6 overflow-hidden border border-neutral-200 bg-white p-12">
          <div className="flex-none">
            {/* Placeholder de logo — pendiente del asset real. */}
            <div className="flex h-9 w-30 items-center justify-center border-2 border-dashed border-neutral-300 bg-neutral-50 text-[11px] uppercase tracking-[0.06em] text-neutral-600">
              Logo
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
            <p
              className="text-xs font-semibold uppercase tracking-[0.08em]"
              style={{ color: RED }}
            >
              Examen de ubicación
            </p>

            <h1
              className="text-[28px] font-semibold leading-[1.35]"
              style={{ color: NAVY }}
            >
              Bienvenido al programa de {languageLabel} de {examPage.client_name}
            </h1>

            <p className="text-[15px] text-neutral-700">
              Este examen sitúa tu nivel actual para asignarte el grupo que te
              corresponde.
            </p>

            {/* Placeholder de ilustración — pendiente del asset real. */}
            <div className="flex min-h-0 flex-1 items-center justify-center border-2 border-dashed border-neutral-300 bg-neutral-50 text-[11px] uppercase tracking-[0.06em] text-neutral-600">
              Ilustración
            </div>

            <p className="text-[13px] leading-relaxed text-neutral-600">
              No es una prueba que se apruebe o se suspenda: sirve para conocer tu
              nivel real, así que respóndelo con naturalidad.
            </p>
          </div>

          <div className="flex-none">
            {/* Enlace, no redirect: el alumno entra al examen cuando decide. */}
            <a
              href={examPage.destination_url}
              className="inline-block px-9 py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: NAVY }}
            >
              Ir a mi examen →
            </a>
          </div>
        </section>

        {/* ---------- Tarjeta derecha: instrucciones ---------- */}
        <section className="flex flex-1 flex-col gap-6 overflow-hidden border border-neutral-200 bg-white p-12">
          <div className="flex-none">
            <h2 className="text-xl font-semibold" style={{ color: NAVY }}>
              Antes de empezar
            </h2>
          </div>

          <InstructionsCarousel steps={INSTRUCTION_STEPS} />
        </section>
      </div>
    </div>
  );
}
