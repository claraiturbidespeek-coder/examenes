import Image from "next/image";

import type { InstructionStep } from "@/lib/exam-instructions";

const NAVY = "#1A3C4D";
const RED = "#B51E40";

/**
 * Los cuatro pasos a la vez, en cuadrícula de 2x2.
 *
 * No lleva "use client" ni estado: sin carrusel no queda nada que interactuar, y
 * los pasos son fijos. Se resuelve entero en el servidor y no manda JavaScript.
 *
 * Sin flechas entre tarjetas: el orden lo dice el «Paso N» de cada una, y unir
 * cuatro celdas en zigzag pedía un trazo en codo para no aparentar que el 3 venía
 * del 4. Sobraba dibujo para algo que el rótulo ya resuelve.
 */
export function InstructionsGrid({ steps }: { steps: InstructionStep[] }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-7">
      {steps.map((step, i) => (
        <StepCard key={step.title} step={step} number={i + 1} />
      ))}
    </div>
  );
}

function StepCard({ step, number }: { step: InstructionStep; number: number }) {
  return (
    <article className="flex min-h-0 flex-col items-center gap-3 overflow-hidden bg-white p-5 text-center">
      {/* La ilustración es lo que cede espacio cuando la ventana es baja: se
          queda con lo que sobre después del texto, que es lo que hay que poder
          leer. El tope evita además que se estire a ocupar toda la tarjeta
          cuando sí hay sitio. object-contain la mete entera sin deformarla. */}
      <div className="flex max-h-24 min-h-0 w-full flex-1 items-center justify-center">
        <Image src={step.image} alt="" priority className="max-h-full w-full object-contain" />
      </div>

      <div className="flex-none">
        <p
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: RED }}
        >
          Paso {number}
        </p>
        <h3 className="mt-1 text-sm font-semibold" style={{ color: NAVY }}>
          {step.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-700">{step.body}</p>
      </div>
    </article>
  );
}
