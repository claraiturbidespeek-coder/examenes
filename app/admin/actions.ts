"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { LANGUAGE_CODES } from "@/lib/languages";
import { slugify } from "@/lib/slugify";
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


// Debe coincidir con exam_pages_client_slug_reserved en la migración. Aquí es
// para dar un mensaje útil; la base de datos es la que realmente lo garantiza.
const RESERVED_SLUGS = ["admin", "api", "login", "_next", "robots.txt"];

// El formulario ya solo ofrece estos seis, pero las acciones son endpoints
// públicos: se valida igual contra la lista, no contra un formato genérico.
const languageSchema = z.enum(LANGUAGE_CODES, {
  message: "Selecciona uno de los idiomas disponibles.",
});

const destinationUrlSchema = z
  .string()
  .trim()
  .url("Debe ser una URL completa, incluyendo https://")
  .refine((url) => /^https?:\/\//i.test(url), {
    message: "La URL debe empezar por http:// o https://",
  });

/** Una fila del formulario: un idioma del cliente. */
const entrySchema = z.object({
  language: languageSchema,
  destination_url: destinationUrlSchema,
  // El formulario ya no lo pide, pero la columna sigue viva para el inventario
  // histórico y los redirects 301: se acepta si alguien lo envía.
  old_wordpress_url: z.string().trim().optional(),
});

const payloadSchema = z.object({
  client_name: z.string().trim().min(1, "Indica el nombre del cliente."),
  legacy_client_id: z.string().trim(),
  entries: z.array(entrySchema).min(1, "Añade al menos un idioma."),
});

export type ExamPagesState = {
  error?: string;
  success?: boolean;
  /** Errores del bloque de datos del cliente, por nombre de campo. */
  clientErrors?: Record<string, string>;
  /** Errores por fila de idioma: índice de fila -> campo -> mensaje. */
  entryErrors?: Record<number, Record<string, string>>;
  /** Resumen para confirmar qué se creó. */
  created?: { client_slug: string; languages: string[] };
};

/**
 * Reparte los errores de zod entre el bloque de datos del cliente y las filas de
 * idioma, que es como los pinta el formulario: cada mensaje acaba junto al campo
 * que lo provocó en vez de en un aviso general.
 */
function collectIssues(error: z.ZodError) {
  const clientErrors: Record<string, string> = {};
  const entryErrors: Record<number, Record<string, string>> = {};

  for (const issue of error.issues) {
    const [head, index, field] = issue.path;
    if (head === "entries" && typeof index === "number" && typeof field === "string") {
      entryErrors[index] = { ...entryErrors[index], [field]: issue.message };
    } else if (typeof head === "string") {
      clientErrors[head] = issue.message;
    }
  }

  return { clientErrors, entryErrors };
}

/**
 * Idiomas repetidos dentro del propio envío. La base de datos lo rechazaría
 * igual, pero señalando la fila concreta se corrige sin adivinar cuál sobra.
 */
function findDuplicateLanguages(entries: { language: string }[]) {
  const entryErrors: Record<number, Record<string, string>> = {};
  const seen = new Map<string, number>();

  for (const [i, entry] of entries.entries()) {
    const first = seen.get(entry.language);
    if (first !== undefined) {
      entryErrors[i] = {
        language: `Este idioma ya está en la fila ${first + 1} de este mismo formulario.`,
      };
    } else {
      seen.set(entry.language, i);
    }
  }

  return entryErrors;
}

/**
 * Crea de una vez todas las páginas de un cliente: una fila de exam_pages por
 * idioma, todas con el mismo client_slug y el mismo legacy_client_id.
 *
 * El insert es una sola sentencia, así que es atómico: si un idioma choca con
 * algo que ya existe, no se crea ninguno. Es preferible a dejar el cliente a
 * medio dar de alta y que alguien tenga que averiguar qué entró y qué no.
 */
export async function createExamPages(
  _prevState: ExamPagesState,
  formData: FormData,
): Promise<ExamPagesState> {
  const supabase = await createServerSupabaseClient();

  // Las políticas RLS ya bloquearían el insert, pero comprobarlo aquí devuelve un
  // mensaje entendible en vez de un error de base de datos.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "No se pudo leer el formulario. Recarga la página." };
  }

  const parsed = payloadSchema.safeParse(raw);

  if (!parsed.success) {
    const { clientErrors, entryErrors } = collectIssues(parsed.error);
    return { error: "Revisa los campos marcados.", clientErrors, entryErrors };
  }

  const { client_name, legacy_client_id, entries } = parsed.data;
  const client_slug = slugify(client_name);

  if (!client_slug) {
    return {
      error: "Revisa los campos marcados.",
      clientErrors: {
        client_name: "De este nombre no sale ninguna URL válida. Usa letras o números.",
      },
    };
  }

  if (RESERVED_SLUGS.includes(client_slug)) {
    return {
      error: "Revisa los campos marcados.",
      clientErrors: {
        client_name: `«${client_slug}» está reservado por la aplicación. Usa otro nombre.`,
      },
    };
  }

  const entryErrors = findDuplicateLanguages(entries);

  if (Object.keys(entryErrors).length > 0) {
    return { error: "Hay idiomas repetidos en el formulario.", entryErrors };
  }

  // Qué choca con lo que ya hay en la base de datos. Se consulta antes de
  // insertar para poder decir exactamente qué fila falla: el error 23505 del
  // insert masivo no dice cuál de todas lo provocó.
  const { data: existing, error: existingError } = await supabase
    .from("exam_pages")
    .select("language")
    .eq("client_slug", client_slug)
    .in(
      "language",
      entries.map((e) => e.language),
    );

  if (existingError) {
    return { error: `No se pudo comprobar los duplicados: ${existingError.message}` };
  }

  if (existing && existing.length > 0) {
    const taken = new Set(existing.map((row) => row.language));
    for (const [i, entry] of entries.entries()) {
      if (taken.has(entry.language)) {
        entryErrors[i] = {
          language: `Ya existe una página para /${client_slug}/${entry.language}.`,
        };
      }
    }
    return {
      error: "Algunas páginas ya existen. Se ha cancelado el alta completa.",
      entryErrors,
    };
  }

  const { error } = await supabase.from("exam_pages").insert(
    entries.map((entry) => ({
      client_slug,
      client_name,
      language: entry.language,
      destination_url: entry.destination_url,
      legacy_client_id: legacy_client_id || null,
      old_wordpress_url: entry.old_wordpress_url || null,
    })),
  );

  if (error) {
    // 23505 aquí significa que alguien creó la misma página entre la
    // comprobación de arriba y este insert. Raro, pero la restricción está para
    // eso: no queda a medias.
    if (error.code === "23505") {
      return {
        error: "Alguien acaba de crear una de estas páginas. Revisa el listado y reintenta.",
      };
    }
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath("/admin");
  for (const entry of entries) {
    revalidatePath(`/${client_slug}/${entry.language}`);
  }

  return {
    success: true,
    created: { client_slug, languages: entries.map((e) => e.language) },
  };
}


const updatePayloadSchema = z.object({
  // Identidad del cliente, no un campo editable. Llega desde el formulario solo
  // para saber a quién se está editando; nada de lo que se envía puede cambiarlo.
  client_slug: z.string().trim().min(1),
  client_name: z.string().trim().min(1, "Indica el nombre del cliente."),
  legacy_client_id: z.string().trim(),
  entries: z
    .array(
      z.object({
        language: languageSchema,
        destination_url: destinationUrlSchema,
      }),
    )
    .min(1, "El cliente tiene que conservar al menos un idioma."),
  /** Filas que el formulario marcó para borrar, ya confirmadas por el usuario. */
  removed_ids: z.array(z.uuid()),
});

export type UpdateClientState = {
  error?: string;
  success?: boolean;
  /** Errores del bloque de datos del cliente, por nombre de campo. */
  clientErrors?: Record<string, string>;
  /** Errores por fila de idioma: índice de fila -> campo -> mensaje. */
  entryErrors?: Record<number, Record<string, string>>;
};

/**
 * Edita un cliente ya existente: su nombre, su ID de cliente y la lista de
 * idiomas que tiene publicados.
 *
 * El client_slug nunca cambia, ni siquiera cuando cambia el nombre. Es el primer
 * segmento de las URLs que ya están repartidas a los alumnos, así que renombrarlo
 * rompería enlaces que están fuera de nuestro control. Se acepta que el slug
 * quede "viejo" respecto al nombre: es el precio de que los enlaces no se rompan.
 */
export async function updateClient(
  _prevState: UpdateClientState,
  formData: FormData,
): Promise<UpdateClientState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "No se pudo leer el formulario. Recarga la página." };
  }

  const parsed = updatePayloadSchema.safeParse(raw);

  if (!parsed.success) {
    const { clientErrors, entryErrors } = collectIssues(parsed.error);
    return { error: "Revisa los campos marcados.", clientErrors, entryErrors };
  }

  const { client_slug, client_name, legacy_client_id, entries, removed_ids } = parsed.data;

  const entryErrors = findDuplicateLanguages(entries);

  if (Object.keys(entryErrors).length > 0) {
    return { error: "Hay idiomas repetidos en el formulario.", entryErrors };
  }

  // Se lee lo que hay antes de tocar nada: si el cliente ya no existe, esto es
  // una edición sobre un panel desactualizado y guardarla lo recrearía a medias
  // en vez de avisar.
  const { data: current, error: currentError } = await supabase
    .from("exam_pages")
    .select("id, language")
    .eq("client_slug", client_slug);

  if (currentError) {
    return { error: `No se pudo leer el cliente: ${currentError.message}` };
  }

  if (!current || current.length === 0) {
    return { error: "Este cliente ya no existe. Recarga el panel." };
  }

  // Nombre e ID de cliente están repetidos en cada fila del cliente. Se
  // actualizan sobre el slug entero y no solo sobre las filas del formulario:
  // si alguien añadió un idioma mientras tanto, esa fila también queda al día.
  const { error: clientError } = await supabase
    .from("exam_pages")
    .update({ client_name, legacy_client_id: legacy_client_id || null })
    .eq("client_slug", client_slug);

  if (clientError) {
    return { error: `No se pudo guardar el cliente: ${clientError.message}` };
  }

  // Un solo upsert cubre los dos casos: el idioma que ya existía recibe su nuevo
  // destino y el que no existía se crea. El conflicto se resuelve por
  // (client_slug, language), así que no hace falta que el navegador mande ids —
  // y no hay envío posible que toque las filas de otro cliente.
  const { error: upsertError } = await supabase.from("exam_pages").upsert(
    entries.map((entry) => ({
      client_slug,
      client_name,
      language: entry.language,
      destination_url: entry.destination_url,
      legacy_client_id: legacy_client_id || null,
    })),
    { onConflict: "client_slug,language" },
  );

  if (upsertError) {
    return { error: `No se pudieron guardar los idiomas: ${upsertError.message}` };
  }

  // El borrado va el último a propósito: si algo falla antes, no se ha destruido
  // nada todavía y se puede reintentar. Y nunca se borra un idioma que el
  // formulario manda como vigente — quitarlo y volver a añadirlo en la misma
  // edición apunta a la misma fila, y borrarla se llevaría por delante el
  // destino que se acaba de guardar.
  const kept = new Set(entries.map((entry) => entry.language));
  const languageById = new Map(current.map((row) => [row.id, row.language]));
  const toDelete = removed_ids.filter((id) => {
    const language = languageById.get(id);
    return language !== undefined && !kept.has(language);
  });

  let deletedLanguages: string[] = [];

  if (toDelete.length > 0) {
    const { data: deleted, error: deleteError } = await supabase
      .from("exam_pages")
      .delete()
      .eq("client_slug", client_slug)
      .in("id", toDelete)
      .select("language");

    if (deleteError) {
      return {
        error: `Se guardaron los cambios del cliente, pero no se pudo eliminar el idioma: ${deleteError.message}`,
      };
    }

    deletedLanguages = deleted?.map((row) => row.language) ?? [];
  }

  revalidatePath("/admin");
  for (const language of new Set([...kept, ...deletedLanguages])) {
    revalidatePath(`/${client_slug}/${language}`);
  }

  return { success: true };
}
