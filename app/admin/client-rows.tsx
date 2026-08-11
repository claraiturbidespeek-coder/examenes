"use client";

import { useState } from "react";

import { EditClientForm, type AdminClient } from "@/app/admin/edit-client-form";
import { languageLabel } from "@/lib/languages";

/**
 * Un cliente en la tabla del panel: la cabecera con su nombre y el botón de
 * editar, y debajo una fila por idioma.
 *
 * `languageFilter` solo recorta lo que se enseña en la tabla. El formulario de
 * edición recibe el cliente entero a propósito: editar viendo media lista
 * llevaría a «añadir» un idioma que en realidad ya existe y pisarle el destino
 * sin avisar.
 */
export function ClientRows({
  client,
  languageFilter,
}: {
  client: AdminClient;
  languageFilter?: string;
}) {
  const [editing, setEditing] = useState(false);

  const visiblePages = languageFilter
    ? client.pages.filter((page) => page.language === languageFilter)
    : client.pages;

  return (
    <tbody className="divide-y divide-neutral-100 border-b border-neutral-200 last:border-b-0">
      <tr className="bg-neutral-50">
        <th scope="rowgroup" colSpan={2} className="px-4 py-3 text-left font-medium text-neutral-900">
          {client.client_name}
        </th>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={() => setEditing((open) => !open)}
            className="cursor-pointer text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
          >
            {editing ? "Cerrar" : "Editar"}
          </button>
        </td>
      </tr>

      {editing ? (
        // Mientras se edita, las filas de idioma se ocultan: el formulario ya
        // muestra esa misma lista, y verla dos veces invita a dudar de cuál manda.
        <tr>
          <td colSpan={3} className="p-4">
            <EditClientForm client={client} onClose={() => setEditing(false)} />
          </td>
        </tr>
      ) : (
        visiblePages.map((page) => (
          <tr key={page.id}>
            <td className="px-4 py-3 text-neutral-700">{languageLabel(page.language)}</td>
            <td className="px-4 py-3">
              <a
                href={`/${client.client_slug}/${page.language}`}
                className="font-mono text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              >
                /{client.client_slug}/{page.language}
              </a>
            </td>
            <td className="max-w-xs truncate px-4 py-3 text-neutral-600">
              {page.destination_url}
            </td>
          </tr>
        ))
      )}
    </tbody>
  );
}
