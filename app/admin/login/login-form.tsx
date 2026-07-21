"use client";

import { useActionState } from "react";

import { signIn, type ActionState } from "@/app/admin/actions";

export function LoginForm({ next }: { next: string }) {
  // El `pending` viene de useActionState, no de useFormStatus: con useFormStatus
  // el botón se quedaba en «Entrando…» y deshabilitado para siempre cuando la
  // acción devolvía un error, y había que recargar para reintentar.
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          // React vacía los campos al terminar la acción. Sin esto, fallar la
          // contraseña obligaría a reescribir también el email.
          defaultValue={state.values?.email ?? ""}
          key={state.values?.email ?? ""}
          required
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
