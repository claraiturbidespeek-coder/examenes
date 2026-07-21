/**
 * Convierte el nombre visible de un cliente en el segmento de URL.
 *
 * El resultado tiene que cumplir exam_pages_client_slug_format (^[a-z0-9-]+$),
 * así que quita acentos en vez de descartarlos: «Fundación Añez» produce
 * «fundacion-anez» y no «fundaci-n-a-ez».
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    // Marcas diacríticas: la descomposición NFD las separa de la letra base.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
