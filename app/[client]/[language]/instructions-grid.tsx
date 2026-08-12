import Image from "next/image";

import type { InstructionStep } from "@/lib/exam-instructions";

const NAVY = "#1A3C4D";

/**
 * Las instrucciones, apiladas en una sola columna.
 *
 * No lleva "use client" ni estado: sin carrusel no queda nada que interactuar, y
 * el contenido es fijo. Se resuelve entero en el servidor y no manda JavaScript.
 *
 * Sin numerar y sin flechas: no son pasos que haya que dar en orden, son cosas
 * que conviene saber antes de empezar. Numerarlas hacía prometer una secuencia
 * que no existe.
 */
export function InstructionsGrid({ steps }: { steps: InstructionStep[] }) {
  return (
    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-7">
      {steps.map((step) => (
        <StepCard key={step.title} step={step} />
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
function StepCard({ step }: { step: InstructionStep }) {
  return (
    <article className="flex min-h-0 items-center gap-6 overflow-hidden bg-white px-8 py-5">
      {/* self-stretch para que la caja de la imagen tome el alto de la tarjeta y
          object-contain la encaje dentro: así la ilustración se adapta a lo que
          haya sin deformarse ni empujar la tarjeta. */}
      <div className="flex w-1/5 flex-none items-center justify-center self-stretch">
        <Image src={step.image} alt="" priority className="max-h-full w-full object-contain" />
      </div>

      <div className="min-w-0 flex-1 text-left">
        <h3 className="text-base font-semibold" style={{ color: NAVY }}>
          {step.title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-700">{step.body}</p>
      </div>
    </article>
  );
}
