"use client";

import { useActionState, useState } from "react";

import { createExamPages, type ExamPagesState } from "@/app/admin/actions";
import { buildExamLink, type LanguageNodes } from "@/lib/exam-link";
import { LANGUAGES, languageLabel } from "@/lib/languages";
import { slugify } from "@/lib/slugify";

type Entry = {
  /** Identidad estable de la fila: sobrevive a que se borren filas de en medio. */
  id: number;
  language: string;
};

const emptyEntry = (id: number): Entry => ({
  id,
  language: "",
});

const inputClass =
  "mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900";
const labelClass = "block text-sm font-medium text-neutral-700";

// Rótulo de un dato que calcula la aplicación, no de un campo que se rellena. Se
// distingue a propósito de labelClass: cuando los dos se ven igual, el dato de
// solo lectura se lee como un campo que no te dejan tocar.
const resultLabelClass = "text-xs font-medium uppercase tracking-wide text-neutral-500";

export function NewPageForm({ nodes }: { nodes: LanguageNodes }) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [legacyId, setLegacyId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([emptyEntry(0)]);
  const [nextId, setNextId] = useState(1);

  const reset = () => {
    setClientName("");
    setLegacyId("");
    setEntries([emptyEntry(0)]);
    setNextId(1);
  };

  // El formulario es controlado, así que los datos viven en este estado y no en
  // el DOM. Un error del servidor ya no puede borrar lo escrito: React vacía los
  // campos no controlados al terminar la acción, pero estos se vuelven a pintar
  // desde el estado.
  const [state, formAction, isPending] = useActionState<ExamPagesState, FormData>(
    async (prevState, formData) => {
      const result = await createExamPages(prevState, formData);
      if (result.success) {
        reset();
        setOpen(false);
      }
      return result;
    },
    {},
  );

  const slug = slugify(clientName);

  const updateEntry = (id: number, patch: Partial<Entry>) =>
    setEntries((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addEntry = () => {
    setEntries((rows) => [...rows, emptyEntry(nextId)]);
    setNextId((n) => n + 1);
  };

  const removeEntry = (id: number) =>
    setEntries((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));

  // Idiomas ya elegidos en otras filas: se marcan como no seleccionables para
  // que el duplicado no llegue siquiera a intentarse.
  const chosen = new Set(entries.map((e) => e.language).filter(Boolean));

  /**
   * La URL tal y como quedará, o qué falta todavía para poder construirla.
   *
   * Se dice el dato que falta en concreto en vez de una frase genérica: quien
   * está a medio rellenar la fila sabe así si le toca elegir idioma, subir a
   * escribir el ID, o las dos cosas.
   */
  const resultingUrl = (language: string) => {
    const clientId = legacyId.trim();
    const node = language ? nodes[language] : null;

    if (clientId && node) {
      return { url: buildExamLink({ clientId, node }), missing: null };
    }
    if (!language && !clientId) {
      return { url: null, missing: "Falta elegir el idioma y escribir el ID de cliente." };
    }
    if (!language) {
      return { url: null, missing: "Falta elegir el idioma." };
    }
    if (!clientId) {
      return { url: null, missing: "Falta escribir el ID de cliente." };
    }
    // El desplegable no deja elegir un idioma sin node, así que aquí solo se
    // llega si lo han quitado con la fila ya rellenada.
    return {
      url: null,
      missing: `${languageLabel(language)} todavía no tiene node configurado.`,
    };
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        Registrar nueva página
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">
        Registrar nueva página
      </h2>

      <form action={formAction} className="mt-5 space-y-6">
        {/* El estado completo viaja como un JSON: las filas son una lista de
            longitud variable y serializarlas como campos sueltos obligaría a
            reconstruir los índices en el servidor. */}
        <input
          type="hidden"
          name="payload"
          value={JSON.stringify({
            client_name: clientName,
            legacy_client_id: legacyId,
            entries: entries.map(({ language }) => ({ language })),
          })}
        />

        {/* ---------- Datos del cliente ---------- */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Cliente
          </legend>

          <div>
            <label htmlFor="client_name" className={labelClass}>
              Nombre del cliente
            </label>
            <input
              id="client_name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="CIMESA"
              required
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-600">
              {slug ? (
                <>
                  Las URLs serán{" "}
                  <span className="font-mono text-neutral-900">/{slug}/…</span>
                </>
              ) : (
                "La URL se genera a partir de este nombre."
              )}
            </p>
            {state.clientErrors?.client_name ? (
              <p className="mt-1 text-xs text-red-700">{state.clientErrors.client_name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="legacy_client_id" className={labelClass}>
              ID Cliente (MS)
            </label>
            <input
              id="legacy_client_id"
              value={legacyId}
              onChange={(e) => setLegacyId(e.target.value)}
              required
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-600">
              El link del examen se construye con este ID y el idioma. Ya no se
              escribe a mano.
            </p>
            {state.clientErrors?.legacy_client_id ? (
              <p className="mt-1 text-xs text-red-700">
                {state.clientErrors.legacy_client_id}
              </p>
            ) : null}
          </div>
        </fieldset>

        {/* ---------- Idiomas ---------- */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Páginas por idioma
          </legend>

          {entries.map((entry, i) => (
            <div key={entry.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-600">Idioma {i + 1}</p>
                {entries.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="cursor-pointer text-xs font-medium text-red-700 hover:underline"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor={`language-${entry.id}`} className={labelClass}>
                    Idioma
                  </label>
                  <select
                    id={`language-${entry.id}`}
                    value={entry.language}
                    onChange={(e) => updateEntry(entry.id, { language: e.target.value })}
                    required
                    className={`${inputClass} cursor-pointer bg-white`}
                  >
                    <option value="" disabled>
                      Selecciona un idioma…
                    </option>
                    {LANGUAGES.map((language) => {
                      const withoutNode = !nodes[language.code];
                      return (
                        <option
                          key={language.code}
                          value={language.code}
                          // Deshabilitado por dos motivos distintos: ya está
                          // elegido en otra fila, o todavía no tiene node y su
                          // link no se podría construir. En los dos casos sigue
                          // visible para que se entienda por qué no se puede.
                          disabled={
                            withoutNode ||
                            (chosen.has(language.code) && entry.language !== language.code)
                          }
                        >
                          {language.label}
                          {withoutNode ? " — sin node configurado" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {state.entryErrors?.[i]?.language ? (
                    <p className="mt-1 text-xs text-red-700">
                      {state.entryErrors[i].language}
                    </p>
                  ) : null}
                </div>

                {/* El link ya no se escribe, pero sí se enseña: es lo que va a
                    recibir el alumno y no debería quedar invisible hasta después
                    de guardar.

                    Va como texto suelto y no dentro de una caja con borde: con
                    el aspecto de un campo se leía como un input deshabilitado, y
                    entonces parece algo que habría que rellenar y no se deja, en
                    vez del resultado de lo que ya se ha rellenado. */}
                <div>
                  <p className={resultLabelClass}>URL resultante</p>
                  {resultingUrl(entry.language).url ? (
                    <p className="mt-1 font-mono text-xs break-all text-neutral-800">
                      {resultingUrl(entry.language).url}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500">
                      {resultingUrl(entry.language).missing}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            disabled={chosen.size >= LANGUAGES.length && entries.length >= LANGUAGES.length}
            className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-default disabled:opacity-50"
          >
            + Agregar idioma
          </button>
        </fieldset>

        {state.error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-60"
          >
            {isPending
              ? "Guardando…"
              : `Guardar ${entries.length} ${entries.length === 1 ? "página" : "páginas"}`}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
