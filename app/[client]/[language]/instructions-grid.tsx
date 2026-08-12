import Image from "next/image";

import type { InstructionStep } from "@/lib/exam-instructions";

const NAVY = "#1A3C4D";
const RED = "#B51E40";

/**
 * Los pasos, apilados en una sola columna.
 *
 * No lleva "use client" ni estado: sin carrusel no queda nada que interactuar, y
 * los pasos son fijos. Se resuelve entero en el servidor y no manda JavaScript.
 *
 * Sin flechas entre tarjetas: el orden lo dice el «Paso N» de cada una, y en una
 * pila vertical el propio apilado ya lo cuenta.
 */
export function InstructionsGrid({ steps }: { steps: InstructionStep[] }) {
  return (
    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-7">
      {steps.map((step, i) => (
        <StepCard key={step.title} step={step} number={i + 1} />
      ))}
    </div>
  );
}

/**
 * Cada tarjeta es ahora mucho más ancha que alta, así que la ilustración va al
 * lado del texto y no encima: apilados, la imagen se quedaba con una franja de
 * pocos píxeles de alto a lo ancho de toda la tarjeta, y el conjunto quedaba
 * descompensado.
 */
function StepCard({ step, number }: { step: InstructionStep; number: number }) {
  return (
    <article className="flex min-h-0 items-center gap-6 overflow-hidden bg-white px-8 py-5">
      {/* self-stretch para que la caja de la imagen tome el alto de la tarjeta y
          object-contain la encaje dentro: así la ilustración se adapta a lo que
          haya sin deformarse ni empujar la tarjeta. */}
      <div className="flex w-1/5 flex-none items-center justify-center self-stretch">
        <Image src={step.image} alt="" priority className="max-h-full w-full object-contain" />
      </div>

      <div className="min-w-0 flex-1 text-center">
        <p
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: RED }}
        >
          Paso {number}
        </p>
        <h3 className="mt-1 text-base font-semibold" style={{ color: NAVY }}>
          {step.title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-700">{step.body}</p>
      </div>
    </article>
  );
}
