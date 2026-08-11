/**
 * El link del examen en my.s-peak.com.
 *
 * Confirmado contra el inventario completo de S-Peak (43 filas): el patrón no
 * tiene excepciones y el node depende solo del idioma, nunca del cliente. Por eso
 * el link no se guarda en cada fila: se construye al servirla, y corregir un node
 * en language_nodes arregla de una vez todas las páginas de ese idioma.
 *
 * Los links del inventario traen además un parámetro `_gl=…`. Es el identificador
 * de sesión de Google Analytics, no forma parte del link funcional y no se
 * reproduce aquí.
 */
const REGISTER_URL = "http://my.s-peak.com/user/register";

export function buildExamLink({ clientId, node }: { clientId: string; node: string }) {
  // La barra de `node/NNN` va literal, tal y como aparece en el inventario.
  // encodeURIComponent la convertiría en %2F y dejaría de ser el mismo link.
  return `${REGISTER_URL}?cliente=${encodeURIComponent(clientId)}&destination=node/${node}`;
}

/**
 * El link que hay que servir para una fila.
 *
 * Manda el explícito si la fila lo trae —así una excepción del inventario sigue
 * funcionando— y si no, el construido. Devuelve null cuando la fila no da para
 * ninguno de los dos, para que quien llame decida qué hacer en vez de recibir una
 * cadena vacía que parezca un link.
 */
export function resolveExamLink({
  destinationUrl,
  clientId,
  node,
}: {
  destinationUrl: string | null;
  clientId: string | null;
  node: string | null | undefined;
}) {
  if (destinationUrl) {
    return destinationUrl;
  }
  if (clientId && node) {
    return buildExamLink({ clientId, node });
  }
  return null;
}

/** Idioma -> node, tal y como lo pasa el panel a los formularios. */
export type LanguageNodes = Record<string, string | null>;
