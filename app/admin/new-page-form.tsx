"use client";

import { useActionState, useState } from "react";

import { createExamPage, type ActionState } from "@/app/admin/actions";
import { LANGUAGES } from "@/lib/languages";

function Field({
  name,
  label,
  hint,
  placeholder,
  type = "text",
  errors,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  errors?: string[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        // React vacía los campos al terminar la acción; sin esto, un duplicado
        // obligaría a reescribir el formulario entero.
        defaultValue={defaultValue ?? ""}
        key={defaultValue ?? ""}
        required
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
      />
      {hint ? (
        <p id={`${name}-hint`} className="mt-1 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {errors?.length ? (
        <p className="mt-1 text-xs text-red-700">{errors[0]}</p>
      ) : null}
    </div>
  );
}

function LanguageField({
  errors,
  defaultValue,
}: {
  errors?: string[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor="language" className="block text-sm font-medium text-neutral-700">
        Idioma
      </label>
      <select
        id="language"
        name="language"
        defaultValue={defaultValue ?? ""}
        key={defaultValue ?? ""}
        required
        aria-describedby="language-hint"
        className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
      >
        {/* Sin idioma preseleccionado: obliga a elegir en vez de dejar que se
            cuele el primero de la lista por descuido. */}
        <option value="" disabled>
          Selecciona un idioma…
        </option>
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      <p id="language-hint" className="mt-1 text-xs text-neutral-500">
        Se guarda como código corto y así aparece en la URL.
      </p>
      {errors?.length ? <p className="mt-1 text-xs text-red-700">{errors[0]}</p> : null}
    </div>
  );
}

export function NewPageForm() {
  const [open, setOpen] = useState(false);

  // Dos cosas aquí:
  //
  // El cierre se hace en la propia acción y no en un useEffect: cerrar es la
  // consecuencia directa del guardado, no una sincronización con estado externo.
  // Al desmontarse el formulario, los campos quedan limpios para la próxima vez.
  //
  // `isPending` sale de useActionState y no de useFormStatus: este último dejaba
  // el botón en «Guardando…» y deshabilitado para siempre cuando la acción
  // devolvía un error (por ejemplo un duplicado), obligando a recargar.
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await createExamPage(prevState, formData);
      if (result.success) {
        setOpen(false);
      }
      return result;
    },
    {},
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
      >
        Añadir página
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">Nueva página de examen</h2>

      <form action={formAction} className="mt-5 space-y-4">
        <Field
          name="client_slug"
          label="Identificador del cliente"
          placeholder="cimesa"
          hint="Aparece en la URL. Minúsculas, números y guiones."
          errors={state.fieldErrors?.client_slug}
          defaultValue={state.values?.client_slug}
        />
        <LanguageField
          errors={state.fieldErrors?.language}
          defaultValue={state.values?.language}
        />
        <Field
          name="client_name"
          label="Nombre visible"
          placeholder="CIMESA"
          hint="Es el nombre que ve el alumno en la página."
          errors={state.fieldErrors?.client_name}
          defaultValue={state.values?.client_name}
        />
        <Field
          name="destination_url"
          label="URL del examen"
          type="url"
          placeholder="https://…"
          hint="Adonde lleva el botón «Ir a mi examen»."
          errors={state.fieldErrors?.destination_url}
          defaultValue={state.values?.destination_url}
        />

        {state.error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
          >
            {isPending ? "Guardando…" : "Guardar página"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
