import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";

import { InstructionsCarousel } from "@/app/[client]/[language]/instructions-carousel";
import { INSTRUCTION_STEPS } from "@/lib/exam-instructions";
import { resolveExamLink } from "@/lib/exam-link";
import { LANGUAGES } from "@/lib/languages";
import { createAdminClient } from "@/lib/supabase/admin";

// La fuente se carga aquí y no en el layout raíz: el panel de admin no la usa y
// no hay razón para que cargue una tipografía que no muestra.
const montserrat = Montserrat({ subsets: ["latin"], display: "swap" });

// Navy es la superficie: manda en las tarjetas, que son los bloques grandes.
// Rojo no aparece nunca como fondo de superficie ni como texto sobre navy (ahí
// quedaría ilegible, ambos son oscuros): se reserva para el CTA y para los
// acentos dentro del visor blanco del carrusel, donde sí destaca.
const NAVY = "#1A3C4D";

// Sobre navy. Medido: 11.6:1 el blanco, 8.9:1 este gris claro.
const ON_NAVY_SOFT = "#D5DFE4";

// Sin caché: cuando el equipo añade o cambia una página en el admin, el enlace
// que ya se repartió a los alumnos debe reflejarlo en la siguiente carga.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ client: string; language: string }>;
};

export default async function ExamAccessPage({ params }: PageProps) {
  const { client, language } = await params;

  const supabase = createAdminClient();
  const slug = client.toLowerCase();
  const languageCode = language.toLowerCase();

  // El node hace falta casi siempre, y esperar a saber si la fila trae link
  // propio para pedirlo encadenaría dos viajes a Supabase en la ruta que ve el
  // alumno. Se piden a la vez y a veces sobra el segundo.
  const [{ data: examPage, error }, { data: languageNode, error: nodeError }] =
    await Promise.all([
      supabase
        .from("exam_pages")
        .select("client_name, destination_url, language, legacy_client_id")
        .eq("client_slug", slug)
        .eq("language", languageCode)
        .maybeSingle(),
      supabase
        .from("language_nodes")
        .select("node")
        .eq("language", languageCode)
        .maybeSingle(),
    ]);

  if (error) {
    // Un fallo de base de datos no es una página inexistente. Se distingue para
    // que un incidente de Supabase no se lea como "este cliente no existe".
    throw new Error(`No se pudo consultar exam_pages: ${error.message}`);
  }

  if (nodeError) {
    throw new Error(`No se pudo consultar language_nodes: ${nodeError.message}`);
  }

  if (!examPage) {
    notFound();
  }

  const destination = resolveExamLink({
    destinationUrl: examPage.destination_url,
    clientId: examPage.legacy_client_id,
    node: languageNode?.node,
  });

  // La página existe pero no hay link que servir. Se corta aquí en vez de pintar
  // un botón que no lleva a ninguna parte: un alumno delante de un enlace muerto
  // no sabe qué hacer, y así queda además en los logs como lo que es, un fallo de
  // datos. Con la restricción exam_pages_link_resolvable solo puede pasar si el
  // idioma se ha quedado sin node.
  if (!destination) {
    throw new Error(
      `Sin link para /${slug}/${languageCode}: la fila no trae destination_url y falta el node de «${languageCode}» en language_nodes.`,
    );
  }

  const languageLabel =
    LANGUAGES.find((l) => l.code === examPage.language)?.label ?? examPage.language;

  return (
    <div className={`${montserrat.className} h-screen w-screen overflow-hidden bg-white`}>
      {/* ---------------- Aviso en pantallas estrechas ----------------
          Por debajo de 900px las dos tarjetas no caben sin romperse, y el examen
          tampoco funciona en móvil (paso 4 de las instrucciones). Antes que
          servir un amasijo ilegible, se dice lo único útil: usa un ordenador.
          El corte es puramente CSS, así que no hay parpadeo al hidratar. */}
      <div
        className="flex h-full flex-col items-center justify-center gap-8 px-8 text-center min-[900px]:hidden"
        style={{ background: NAVY }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marca: no
            hay nada que optimizar y next/image no procesa SVG local sin más. */}
        <img src="/logo_white.svg" alt="S-Peak" className="w-44" />
        <p className="max-w-xs text-lg font-semibold leading-snug text-white">
          Este examen debe tomarse desde una computadora.
        </p>
        <p className="max-w-xs text-sm" style={{ color: ON_NAVY_SOFT }}>
          Abre este mismo enlace en una computadora para empezar.
        </p>
      </div>

      {/* ---------------- Pantalla completa ----------------
          h-full + overflow-hidden: se resuelve sin scroll vertical, como en el
          wireframe. El reparto interno lo hace flexbox. */}
      <div className="hidden h-full gap-10 p-10 min-[900px]:flex">
        {/* -------- Tarjeta izquierda: saludo y acceso -------- */}
        <section
          className="flex flex-[0_0_40%] flex-col gap-10 overflow-hidden p-14"
          style={{ background: NAVY }}
        >
          <div className="flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element -- ver arriba */}
            <img src="/logo_white.svg" alt="S-Peak" className="w-36" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-6">
            <p
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: ON_NAVY_SOFT }}
            >
              Examen de ubicación
            </p>

            <h1 className="text-[28px] font-semibold leading-[1.35] text-white">
              Bienvenido al programa de {languageLabel} de {examPage.client_name}
            </h1>

            <p className="text-[15px] leading-relaxed" style={{ color: ON_NAVY_SOFT }}>
              Este examen sitúa tu nivel actual para asignarte el grupo que te
              corresponde.
            </p>

            {/* Placeholder de ilustración: entre los assets recibidos no hay
                ninguno equivalente, así que se queda a la espera. */}
            <div className="flex min-h-0 flex-1 items-center justify-center border-2 border-dashed border-white/25 text-[11px] uppercase tracking-[0.06em] text-white/50">
              Ilustración
            </div>

            <p className="text-[13px] leading-relaxed text-white/70">
              No es una prueba que se apruebe o se suspenda: sirve para conocer tu
              nivel real, así que respóndelo con naturalidad.
            </p>
          </div>

          <div className="flex-none">
            {/* Enlace, no redirect: el alumno entra al examen cuando decide.
                Único uso del rojo como superficie en toda la página — es el
                elemento que debe llamar la atención. */}
            <a
              href={destination}
              className="inline-block cursor-pointer bg-[#B51E40] px-9 py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Ir a mi examen →
            </a>
          </div>
        </section>

        {/* -------- Tarjeta derecha: instrucciones -------- */}
        <section
          className="flex flex-1 flex-col gap-10 overflow-hidden p-14"
          style={{ background: NAVY }}
        >
          <div className="flex-none">
            <h2 className="text-xl font-semibold text-white">Antes de empezar</h2>
          </div>

          <InstructionsCarousel steps={INSTRUCTION_STEPS} />
        </section>
      </div>
    </div>
  );
}
