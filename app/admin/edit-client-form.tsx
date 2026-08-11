"use client";

import { useActionState, useState } from "react";

import { updateClient, type UpdateClientState } from "@/app/admin/actions";
import { LANGUAGES, languageLabel } from "@/lib/languages";

/** Un cliente tal y como lo agrupa el panel: sus datos más sus idiomas. */
export type AdminClient = {
  client_slug: string;
  client_name: string;
  legacy_client_id: string;
  pages: { id: string; language: string; destination_url: string }[];
};

type Row = {
  /** Identidad estable en el formulario, también para los idiomas aún sin guardar. */
  key: number;
  /** id de la fila en la base de datos; null si es un idioma que todavía no existe. */
  id: string | null;
  language: string;
  destination_url: string;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900";
const labelClass = "block text-sm font-medium text-neutral-700";

export function EditClientForm({
  client,
  onClose,
}: {
  client: AdminClient;
  onClose: () => void;
}) {
  const [clientName, setClientName] = useState(client.client_name);
  const [legacyId, setLegacyId] = useState(client.legacy_client_id);
  const [rows, setRows] = useState<Row[]>(() =>
    client.pages.map((page, i) => ({
      key: i,
      id: page.id,
      language: page.language,
      destination_url: page.destination_url,
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
    setRows((current) => [...current, { key: nextKey, id: null, language: "", destination_url: "" }]);
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
            entries: rows.map(({ language, destination_url }) => ({
              language,
              destination_url,
            })),
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
            <p className={labelClass}>URL base</p>
            <p className="mt-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 font-mono text-sm text-neutral-700">
              /{client.client_slug}/…
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              No cambia aunque cambies el nombre. Estas direcciones ya están
              repartidas a los alumnos y renombrarlas las rompería.
            </p>
          </div>

          <div>
            <label htmlFor={`edit_legacy_client_id-${client.client_slug}`} className={labelClass}>
              ID Cliente (MS) <span className="font-normal text-neutral-600">(opcional)</span>
            </label>
            <input
              id={`edit_legacy_client_id-${client.client_slug}`}
              value={legacyId}
              onChange={(e) => setLegacyId(e.target.value)}
              className={inputClass}
            />
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
                  <label htmlFor={`edit_language-${row.key}`} className={labelClass}>
                    Idioma
                  </label>
                  {row.id ? (
                    // El idioma de una fila que ya existe no se edita: cambiarlo
                    // sería mover la URL pública sin decirlo. Para eso hay que
                    // eliminar el idioma (con su aviso) y añadir el nuevo.
                    <p className="mt-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-700">
                      {languageLabel(row.language)}
                    </p>
                  ) : (
                    <select
                      id={`edit_language-${row.key}`}
                      value={row.language}
                      onChange={(e) => updateRow(row.key, { language: e.target.value })}
                      required
                      className={`${inputClass} bg-white`}
                    >
                      <option value="" disabled>
                        Selecciona un idioma…
                      </option>
                      {LANGUAGES.map((language) => (
                        <option
                          key={language.code}
                          value={language.code}
                          disabled={taken.has(language.code) && row.language !== language.code}
                        >
                          {language.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {state.entryErrors?.[i]?.language ? (
                    <p className="mt-1 text-xs text-red-700">{state.entryErrors[i].language}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor={`edit_destination_url-${row.key}`} className={labelClass}>
                    URL del examen
                  </label>
                  <input
                    id={`edit_destination_url-${row.key}`}
                    type="url"
                    value={row.destination_url}
                    onChange={(e) => updateRow(row.key, { destination_url: e.target.value })}
                    placeholder="https://…"
                    required
                    className={inputClass}
                  />
                  {state.entryErrors?.[i]?.destination_url ? (
                    <p className="mt-1 text-xs text-red-700">
                      {state.entryErrors[i].destination_url}
                    </p>
                  ) : null}
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
