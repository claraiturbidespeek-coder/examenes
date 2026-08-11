"use client";

import { useActionState, useState } from "react";

import { updateClient, type UpdateClientState } from "@/app/admin/actions";
import { buildExamLink, type LanguageNodes } from "@/lib/exam-link";
import { LANGUAGES, languageLabel } from "@/lib/languages";

/** Un cliente tal y como lo agrupa el panel: sus datos más sus idiomas. */
export type AdminClient = {
  client_slug: string;
  client_name: string;
  legacy_client_id: string;
  pages: {
    id: string;
    language: string;
    /** Link propio de la fila. Casi siempre null: lo normal es construirlo. */
    destination_url: string | null;
  }[];
};

type Row = {
  /** Identidad estable en el formulario, también para los idiomas aún sin guardar. */
  key: number;
  /** id de la fila en la base de datos; null si es un idioma que todavía no existe. */
  id: string | null;
  language: string;
  /** Link explícito heredado, si la fila lo trae. No se edita desde aquí. */
  destinationUrl: string | null;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900";
const labelClass = "block text-sm font-medium text-neutral-700";

// Rótulo de un dato que calcula la aplicación, no de un campo que se rellena. Se
// distingue a propósito de labelClass: cuando los dos se ven igual, el dato de
// solo lectura se lee como un campo que no te dejan tocar.
const resultLabelClass = "text-xs font-medium uppercase tracking-wide text-neutral-500";

export function EditClientForm({
  client,
  nodes,
  onClose,
}: {
  client: AdminClient;
  nodes: LanguageNodes;
  onClose: () => void;
}) {
  const [clientName, setClientName] = useState(client.client_name);
  const [legacyId, setLegacyId] = useState(client.legacy_client_id);
  const [rows, setRows] = useState<Row[]>(() =>
    client.pages.map((page, i) => ({
      key: i,
      id: page.id,
      language: page.language,
      destinationUrl: page.destination_url,
    })),
  );
  const [nextKey, setNextKey] = useState(client.pages.length);

  // Idiomas ya confirmados para borrar. No se borran aquí: se aplican al
  // guardar, y hasta entonces siguen a la vista para poder deshacerlos.
  const [removed, setRemoved] = useState<Row[]>([]);
  // Fila que está pidiendo confirmación ahora mismo.
  const [confirming, setConfirming] = useState<number | null>(null);

  // Mismo trato que en el alta: el formulario es controlado y su estado vive
  // aquí, así que un error del servidor devuelve la pantalla tal cual estaba en
  // vez de vaciar lo que se había escrito.
  const [state, formAction, isPending] = useActionState<UpdateClientState, FormData>(
    async (prevState, formData) => {
      const result = await updateClient(prevState, formData);
      if (result.success) {
        onClose();
      }
      return result;
    },
    {},
  );

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    setRows((current) => [
      ...current,
      { key: nextKey, id: null, language: "", destinationUrl: null },
    ]);
    setNextKey((n) => n + 1);
  };

  /** Un idioma que aún no existe en la base de datos se quita sin más: no hay
   *  ninguna URL pública que dependa de él todavía. */
  const discardRow = (key: number) => setRows((current) => current.filter((r) => r.key !== key));

  const confirmRemove = (row: Row) => {
    setRows((current) => current.filter((r) => r.key !== row.key));
    setRemoved((current) => [...current, row]);
    setConfirming(null);
  };

  const undoRemove = (row: Row) => {
    setRemoved((current) => current.filter((r) => r.key !== row.key));
    setRows((current) => [...current, row]);
  };

  // Idiomas que no se pueden elegir en una fila nueva: los que ya están en el
  // formulario y los que están esperando borrado. Para recuperar uno de estos
  // últimos está «Deshacer», que además conserva su destino.
  const taken = new Set([...rows, ...removed].map((r) => r.language).filter(Boolean));

  // El ID de cliente solo hace falta si algún idioma necesita link construido.
  // Un cliente que venga entero del inventario, con su link propio en cada fila,
  // puede editarse sin inventarse un ID que no tiene.
  const needsClientId = rows.some((row) => !row.destinationUrl);

  /**
   * Lo que se va a servir en esa fila y de dónde sale, o qué falta todavía para
   * poder construirlo. Se nombra el dato que falta en concreto en vez de una
   * frase genérica, para no dejar a nadie buscando qué le queda por rellenar.
   */
  const resultingUrl = (row: Row) => {
    if (row.destinationUrl) {
      return { url: row.destinationUrl, explicit: true, missing: null };
    }

    const clientId = legacyId.trim();
    const node = row.language ? nodes[row.language] : null;

    if (clientId && node) {
      return {
        url: buildExamLink({ clientId, node }),
        explicit: false,
        missing: null,
      };
    }
    if (!row.language && !clientId) {
      return {
        url: null,
        explicit: false,
        missing: "Falta elegir el idioma y escribir el ID de cliente.",
      };
    }
    if (!row.language) {
      return { url: null, explicit: false, missing: "Falta elegir el idioma." };
    }
    if (!clientId) {
      return { url: null, explicit: false, missing: "Falta escribir el ID de cliente." };
    }
    return {
      url: null,
      explicit: false,
      missing: `${languageLabel(row.language)} todavía no tiene node configurado.`,
    };
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h3 className="text-base font-semibold text-neutral-900">
        Editar {client.client_name}
      </h3>

      <form action={formAction} className="mt-5 space-y-6">
        <input
          type="hidden"
          name="payload"
          value={JSON.stringify({
            client_slug: client.client_slug,
            client_name: clientName,
            legacy_client_id: legacyId,
            entries: rows.map(({ language }) => ({ language })),
            removed_ids: removed.map((r) => r.id).filter(Boolean),
          })}
        />

        {/* ---------- Datos del cliente ---------- */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Cliente
          </legend>

          <div>
            <label htmlFor={`edit_client_name-${client.client_slug}`} className={labelClass}>
              Nombre del cliente
            </label>
            <input
              id={`edit_client_name-${client.client_slug}`}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className={inputClass}
            />
            {state.clientErrors?.client_name ? (
              <p className="mt-1 text-xs text-red-700">{state.clientErrors.client_name}</p>
            ) : null}
          </div>

          <div>
            <p className={resultLabelClass}>URL base</p>
            <p className="mt-1 font-mono text-sm text-neutral-800">
              /{client.client_slug}/…
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              No cambia aunque cambies el nombre. Estas direcciones ya están
              repartidas a los alumnos y renombrarlas las rompería.
            </p>
          </div>

          <div>
            <label htmlFor={`edit_legacy_client_id-${client.client_slug}`} className={labelClass}>
              ID Cliente (MS){" "}
              {needsClientId ? null : (
                <span className="font-normal text-neutral-600">(opcional)</span>
              )}
            </label>
            <input
              id={`edit_legacy_client_id-${client.client_slug}`}
              value={legacyId}
              onChange={(e) => setLegacyId(e.target.value)}
              required={needsClientId}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-600">
              {needsClientId
                ? "El link de los idiomas que no traen uno propio se construye con este ID."
                : "Todos los idiomas de este cliente traen su link propio, así que aquí no hace falta."}
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

          {rows.map((row, i) => (
            <div
              key={row.key}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-neutral-600">
                  {row.id ? (
                    <span className="font-mono text-neutral-700">
                      /{client.client_slug}/{row.language}
                    </span>
                  ) : (
                    `Idioma nuevo ${i + 1}`
                  )}
                </p>
                {row.id ? (
                  rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setConfirming(row.key)}
                      className="cursor-pointer text-xs font-medium text-red-700 hover:underline"
                    >
                      Eliminar
                    </button>
                  ) : null
                ) : (
                  <button
                    type="button"
                    onClick={() => discardRow(row.key)}
                    className="cursor-pointer text-xs font-medium text-neutral-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  {row.id ? (
                    // El idioma de una fila que ya existe no se edita: cambiarlo
                    // sería mover la URL pública sin decirlo. Para eso hay que
                    // eliminar el idioma (con su aviso) y añadir el nuevo.
                    //
                    // Al no haber campo tampoco hay <label>: un `for` apuntando a
                    // un id que no existe no rotula nada, solo despista al lector
                    // de pantalla.
                    <>
                      <p className={resultLabelClass}>Idioma</p>
                      <p className="mt-1 text-sm text-neutral-800">
                        {languageLabel(row.language)}
                      </p>
                    </>
                  ) : (
                    <>
                      <label htmlFor={`edit_language-${row.key}`} className={labelClass}>
                        Idioma
                      </label>
                      <select
                        id={`edit_language-${row.key}`}
                        value={row.language}
                        onChange={(e) => updateRow(row.key, { language: e.target.value })}
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
                              // Sin node no hay link que construir para un idioma
                              // nuevo, así que no se puede añadir todavía.
                              disabled={
                                withoutNode ||
                                (taken.has(language.code) && row.language !== language.code)
                              }
                            >
                              {language.label}
                              {withoutNode ? " — sin node configurado" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </>
                  )}
                  {state.entryErrors?.[i]?.language ? (
                    <p className="mt-1 text-xs text-red-700">{state.entryErrors[i].language}</p>
                  ) : null}
                </div>

                {/* El link no se edita: o se construye con el ID de cliente y el
                    node del idioma, o la fila trae el suyo propio del inventario.
                    Un campo editable aquí sería una tercera versión compitiendo
                    con esas dos.

                    Y se presenta como texto, no dentro de una caja con borde: con
                    el aspecto de un campo se leía como un input deshabilitado. */}
                <div>
                  <p className={resultLabelClass}>URL resultante</p>
                  {resultingUrl(row).url ? (
                    <>
                      <p className="mt-1 font-mono text-xs break-all text-neutral-800">
                        {resultingUrl(row).url}
                      </p>
                      <p className="mt-1 text-xs text-neutral-600">
                        {resultingUrl(row).explicit
                          ? "Link propio de esta fila, heredado del inventario. Manda sobre el construido y se conserva al guardar."
                          : "Se construye con el ID de cliente y el node del idioma."}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-neutral-500">
                      {resultingUrl(row).missing}
                    </p>
                  )}
                </div>
              </div>

              {confirming === row.key ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">
                    ¿Eliminar el idioma {languageLabel(row.language)}?
                  </p>
                  <p className="mt-1 text-xs text-red-700">
                    Al guardar dejará de funcionar{" "}
                    <span className="font-mono">
                      /{client.client_slug}/{row.language}
                    </span>
                    . Cualquier alumno que tenga esa dirección verá una página de
                    error, y no hay forma de avisarle desde aquí.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => confirmRemove(row)}
                      className="cursor-pointer rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            disabled={taken.size >= LANGUAGES.length}
            className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-default disabled:opacity-50"
          >
            + Agregar idioma
          </button>
        </fieldset>

        {removed.length > 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              Se eliminarán al guardar
            </p>
            <ul className="mt-2 space-y-1.5">
              {removed.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center justify-between gap-3 text-xs text-red-700"
                >
                  <span className="font-mono">
                    /{client.client_slug}/{row.language}
                  </span>
                  <button
                    type="button"
                    onClick={() => undoRemove(row)}
                    className="cursor-pointer font-medium underline hover:no-underline"
                  >
                    Deshacer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
