"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** El formulario lo usa para cerrarse y limpiarse tras un guardado correcto. */
  success?: boolean;
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
  language: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Indica el idioma.")
    .regex(SLUG, "Solo minúsculas, números y guiones (ej. es)."),
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
    return { error: "Introduce email y contraseña." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje genérico a propósito: distinguir "usuario no existe" de
    // "contraseña incorrecta" permitiría enumerar cuentas del equipo.
    return { error: "Email o contraseña incorrectos." };
  }

  // Tener cuenta en Supabase Auth no basta para entrar al panel: hay que estar en
  // app_admins. Si el registro público del proyecto está abierto, cualquiera
  // puede crearse una cuenta — pero se queda aquí.
  const { data: isAdmin } = await supabase.rpc("is_app_admin");

  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel." };
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

  const parsed = examPageSchema.safeParse({
    client_slug: formData.get("client_slug"),
    language: formData.get("language"),
    client_name: formData.get("client_name"),
    destination_url: formData.get("destination_url"),
  });

  if (!parsed.success) {
    return {
      error: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const { error } = await supabase.from("exam_pages").insert(parsed.data);

  if (error) {
    // 23505 = unique_violation, es decir ya existe una página para ese
    // cliente + idioma. Es el error más probable en uso normal.
    if (error.code === "23505") {
      return {
        error: `Ya existe una página para /${parsed.data.client_slug}/${parsed.data.language}.`,
      };
    }
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath(`/${parsed.data.client_slug}/${parsed.data.language}`);

  return { success: true };
}
