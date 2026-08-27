import { Montserrat } from "next/font/google";

// Misma razón que en app/[client]/[language]/page.tsx: esta es la única
// pantalla del sitio (fuera del panel) que usa esta tipografía.
const montserrat = Montserrat({ subsets: ["latin"], display: "swap" });

// Mismos tokens que la página del alumno, para que ambas pantallas se lean
// como parte del mismo sistema.
const NAVY = "#1A3C4D";
const ON_NAVY_SOFT = "#D5DFE4";

export default function NotFound() {
  return (
    // h-screen + overflow-hidden: una sola pantalla, sin scroll, igual que en
    // la página del alumno. No hace falta el corte a 900px de esa página
    // (ahí existe porque el layout de dos tarjetas no cabe en móvil); aquí
    // solo se ajustan tamaños y aire con el mismo punto de corte.
    <div
      className={`${montserrat.className} flex h-screen w-screen flex-col items-center justify-center gap-8 px-8 text-center min-[900px]:gap-10`}
      style={{ background: NAVY }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marca:
          no hay nada que optimizar y next/image no procesa SVG local sin más. */}
      <img src="/logo_white.svg" alt="S-Peak" className="w-36 min-[900px]:w-44" />

      <div className="flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-semibold leading-snug text-white min-[900px]:text-[28px]">
          Este enlace no es válido
        </h1>

        {/* Sin detalles sobre qué combinación falló ni qué clientes existen: la
            página es pública y no debe servir para tantear slugs. */}
        <p className="text-[15px] leading-relaxed" style={{ color: ON_NAVY_SOFT }}>
          Puede haber caducado o tener un error de escritura. Verifica que la
          dirección sea exactamente la que te compartieron, o solicita un
          enlace nuevo a la persona responsable de tu formación.
        </p>
      </div>
    </div>
  );
}
