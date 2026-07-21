"use client";

import { useState } from "react";

import type { InstructionStep } from "@/lib/exam-instructions";

const NAVY = "#1A3C4D";
const RED = "#B51E40";

/**
 * Carrusel de instrucciones: un paso visible a la vez, avance manual.
 *
 * Sin autoplay a propósito — son instrucciones que hay que leer, y un paso que
 * se va solo a media lectura obliga a perseguirlo. El alumno avanza cuando
 * quiere, igual que en el wireframe de referencia.
 *
 * El visor es blanco sobre la tarjeta navy: además de dar aire, es lo que
 * permite usar el rojo de acento en el número de paso y en el punto activo.
 * Sobre navy, el rojo queda a 1.4:1 e ilegible; sobre blanco llega a 8.3:1.
 */
export function InstructionsCarousel({ steps }: { steps: InstructionStep[] }) {
  const [index, setIndex] = useState(0);
  const total = steps.length;
  const atStart = index === 0;
  const atEnd = index === total - 1;

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(total - 1, i)));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8">
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <div
          className="flex h-full transition-transform duration-400 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="flex h-full min-w-0 flex-[0_0_100%] items-center gap-10 px-14"
              // Los pasos fuera de pantalla no deben ser navegables con el
              // teclado ni anunciados por un lector: están ocultos visualmente
              // pero siguen en el DOM para que la transición funcione.
              aria-hidden={i !== index}
              inert={i !== index}
            >
              {/* Placeholder de icono — pendiente del asset real. */}
              <div
                className="flex h-22 w-22 flex-[0_0_5.5rem] items-center justify-center border-2 border-dashed border-neutral-300 text-xs font-semibold"
                style={{ color: NAVY }}
              >
                {i + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-[0.12em]"
                  style={{ color: RED }}
                >
                  Paso {i + 1} de {total}
                </p>
                <h3 className="mb-3 text-lg font-semibold" style={{ color: NAVY }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-700">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-none items-center justify-between">
        <Arrow
          label="Paso anterior"
          glyph="‹"
          disabled={atStart}
          onClick={() => goTo(index - 1)}
        />

        <div className="flex gap-3">
          {steps.map((step, i) => (
            <button
              key={step.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir al paso ${i + 1}: ${step.title}`}
              aria-current={i === index}
              // Sobre navy el rojo no destacaría, así que el punto activo es
              // blanco; los inactivos, blanco muy rebajado.
              className="h-2 w-2 cursor-pointer border-0 p-0 transition-colors"
              style={{ background: i === index ? "#FFFFFF" : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>

        <Arrow
          label="Paso siguiente"
          glyph="›"
          disabled={atEnd}
          onClick={() => goTo(index + 1)}
        />
      </div>
    </div>
  );
}

function Arrow({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 cursor-pointer items-center justify-center border border-white/40 bg-transparent text-base text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {glyph}
    </button>
  );
}
