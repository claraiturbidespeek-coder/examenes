"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { LANGUAGE_CODES } from "@/lib/languages";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** El formulario lo usa para cerrarse y limpiarse tras un guardado correcto. */
  success?: boolean;
  /**
   * Lo que el usuario había escrito. React resetea los campos no controlados en
   * cuanto la acción termina, así que sin esto un error de validación o un
   * duplicado le borraría todo lo tecleado. El formulario lo reinyecta como
   * defaultValue.
   */
  values?: Record<string, string>;
};

const SLUG = /^[a-z0-9-]+$/;

// Debe coincidir con exam_pages_client_slug_reserved en la migración. Aquí es
// para dar un mensaje útil; la base de datos es la que realmente lo garantiza.
const RESERVED_SLUGS = ["admin", "api", "login", "_next", "robots.txt"];

const examPageSchema = z.object({
  client_slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Indica el identificador del cliente.")
    .regex(SLUG, "Solo minúsculas, números y guiones (ej. cimesa).")
    .refine((slug) => !RESERVED_SLUGS.includes(slug), {
      message: "Ese identificador está reservado por la aplicación.",
    }),
  // El formulario ya solo ofrece estos seis, pero la acción es un endpoint
  // público: se valida igual contra la lista, no contra un formato genérico.
  language: z.enum(LANGUAGE_CODES, {
    message: "Selecciona uno de los idiomas disponibles.",
  }),
  client_name: z.string().trim().min(1, "Indica el nombre visible del cliente."),
  destination_url: z
    .string()
    .trim()
    .url("Debe ser una URL completa, incluyendo https://")
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "La URL debe empezar por http:// o https://",
    }),
});

export async function signIn(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Introduce email y contraseña.", values: { email } };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje genérico a propósito: distinguir "usuario no existe" de
    // "contraseña incorrecta" permitiría enumerar cuentas del equipo.
    return { error: "Email o contraseña incorrectos.", values: { email } };
  }

  // Tener cuenta en Supabase Auth no basta para entrar al panel: hay que estar en
  // app_admins. Si el registro público del proyecto está abierto, cualquiera
  // puede crearse una cuenta — pero se queda aquí.
  const { data: isAdmin } = await supabase.rpc("is_app_admin");

  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel.", values: { email } };
  }

  // Solo rutas internas del admin: un `next` controlado por el atacante podría
  // convertir el login en un redirect abierto hacia un dominio externo.
  const destination = next.startsWith("/admin") ? next : "/admin";
  redirect(destination);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createExamPage(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  // Las políticas RLS ya bloquearían el insert, pero comprobarlo aquí devuelve un
  // mensaje entendible en vez de un error de base de datos.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  const values = {
    client_slug: String(formData.get("client_slug") ?? ""),
    language: String(formData.get("language") ?? ""),
    client_name: String(formData.get("client_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
  };

  const parsed = examPageSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const { error } = await supabase.from("exam_pages").insert(parsed.data);

  if (error) {
    // 23505 = unique_violation, es decir ya existe una página para ese
    // cliente + idioma. Es el error más probable en uso normal.
    if (error.code === "23505") {
      return {
        error: `Ya existe una página para /${parsed.data.client_slug}/${parsed.data.language}.`,
        values,
      };
    }
    return { error: `No se pudo guardar: ${error.message}`, values };
  }

  revalidatePath("/admin");
  revalidatePath(`/${parsed.data.client_slug}/${parsed.data.language}`);

  return { success: true };
}
