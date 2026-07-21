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
