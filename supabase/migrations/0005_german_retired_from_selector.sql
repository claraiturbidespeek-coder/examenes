-- Alemán deja de ofrecerse: se quita de LANGUAGES en lib/languages.ts, que es
-- la fuente única que ve el panel (alta, edición y validación de la Server
-- Action).
--
-- A propósito, esta migración NO toca exam_pages_language_allowed (0003) ni
-- language_nodes_language_allowed (0004): dejar 'de' permitido en ambas no
-- hace daño porque el panel ya no deja elegirlo, y si el idioma vuelve algún
-- día se evita una migración para reactivarlo. Desde aquí, la lista de esas
-- dos restricciones y la de LANGUAGES ya no coinciden — es intencional, no un
-- descuido. Se deja constancia en los comentarios de ambas.
comment on column public.exam_pages.language is
  'Código corto del idioma; segmento de la URL pública. Valores permitidos en la restricción exam_pages_language_allowed, que desde que se retiró alemán del selector (0005) es un superconjunto de LANGUAGES en lib/languages.ts a propósito: ''de'' sigue permitido en la base aunque el panel ya no lo ofrezca.';

comment on constraint exam_pages_language_allowed on public.exam_pages is
  'Superconjunto intencional de LANGUAGES en lib/languages.ts desde 0005: alemán (''de'') se quitó del selector del panel pero se deja permitido aquí porque no hace daño y ahorra una migración si el idioma vuelve.';

comment on constraint language_nodes_language_allowed on public.language_nodes is
  'Superconjunto intencional de LANGUAGES en lib/languages.ts desde 0005: alemán (''de'') se quitó del selector del panel pero se deja permitido aquí porque no hace daño y ahorra una migración si el idioma vuelve. La fila language_nodes.de se borra aparte (fuera de esta migración) porque ya no hay ninguna página en ese idioma.';
