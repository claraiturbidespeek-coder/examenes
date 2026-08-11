"use client";

import { useId, useState } from "react";

import { ClientRows } from "@/app/admin/client-rows";
import type { AdminClient } from "@/app/admin/edit-client-form";
import { LANGUAGES } from "@/lib/languages";
import { slugify } from "@/lib/slugify";

/**
 * La tabla de páginas con sus filtros. Filtra en el navegador sobre lo que ya
 * vino en la respuesta: el listado del panel es de decenas de clientes, así que
 * ir al servidor por cada tecla costaría más de lo que ahorra.
 */
export function ClientsTable({ clients }: { clients: AdminClient[] }) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const searchId = useId();
  const languageId = useId();

  // slugify ya quita acentos y mayúsculas, que es justo lo que hace falta para
  // buscar. Usarlo aquí también significa que el nombre y el slug se comparan
  // con la misma vara: «Fundación Añez» se encuentra escribiendo «anez».
  const term = slugify(search);

  const filtered = clients.filter((client) => {
    const matchesTerm =
      !term ||
      slugify(client.client_name).includes(term) ||
      client.client_slug.includes(term);
    const matchesLanguage =
      !language || client.pages.some((page) => page.language === language);

    return matchesTerm && matchesLanguage;
  });

  const hasFilters = search.trim() !== "" || language !== "";

  const clearFilters = () => {
    setSearch("");
    setLanguage("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor={searchId} className="block text-sm font-medium text-neutral-700">
            Buscar cliente
          </label>
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o URL…"
            className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="min-w-44">
          <label htmlFor={languageId} className="block text-sm font-medium text-neutral-700">
            Idioma
          </label>
          <select
            id={languageId}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
          >
            <option value="">Todos los idiomas</option>
            {LANGUAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Idioma</th>
              <th className="px-4 py-3 font-medium">URL pública</th>
              <th className="px-4 py-3 font-medium">Destino</th>
            </tr>
          </thead>

          {filtered.length > 0 ? (
            filtered.map((client) => (
              <ClientRows
                key={client.client_slug}
                client={client}
                languageFilter={language}
              />
            ))
          ) : (
            <tbody>
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-600">
                  {clients.length === 0 ? (
                    "Todavía no hay ninguna página. Añade la primera."
                  ) : (
                    <>
                      <span className="block">
                        Ningún cliente coincide con los filtros.
                      </span>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-2 cursor-pointer text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
                      >
                        Ver todos los clientes
                      </button>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
