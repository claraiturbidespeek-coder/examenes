/**
 * Idiomas en los que S-Peak entrega exámenes.
 *
 * El `code` es lo que se guarda en exam_pages.language y lo que aparece en la
 * URL pública (/cimesa/es). El `label` es solo para mostrar en el panel: el
 * equipo elige "Español", no "es".
 *
 * Fuente única para el formulario y para la validación del servidor, de modo que
 * no puedan desincronizarse.
 */
export const LANGUAGES = [
  { code: "es", label: "Español" },
  { code: "en", label: "Inglés" },
  { code: "fr", label: "Francés" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugués" },
  { code: "de", label: "Alemán" },
] as const;

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as unknown as [
  string,
  ...string[],
];

/**
 * Nombre para mostrar de un código guardado. Devuelve el propio código si no está
 * en la lista: en la base de datos puede quedar algún idioma de la migración que
 * aquí ya no se ofrezca, y enseñar el código es más útil que una celda vacía.
 */
export function languageLabel(code: string) {
  return LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
