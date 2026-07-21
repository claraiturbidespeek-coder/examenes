-- Restringe exam_pages.language a los seis idiomas que ofrece S-Peak.
--
-- Hasta ahora la lista solo existía en lib/languages.ts y la aplicaba la Server
-- Action. La carga del inventario completo se hará por SQL directo, que no pasa
-- por la aplicación: sin esto, un código mal escrito («ES», «esp», «prt») entra
-- sin protestar y produce una URL pública que nadie encuentra.
--
-- El check de formato genérico se sustituye en vez de acumularse: la lista ya
-- implica minúsculas y ausencia de espacios, así que mantener los dos solo
-- dejaría dos sitios donde mirar cuando algo falle.
alter table public.exam_pages
  drop constraint exam_pages_language_format;

alter table public.exam_pages
  add constraint exam_pages_language_allowed
  check (language in ('es', 'en', 'fr', 'it', 'pt', 'de'));

comment on column public.exam_pages.language is
  'Código corto del idioma; segmento de la URL pública. Valores permitidos en la restricción exam_pages_language_allowed, que debe mantenerse en sintonía con LANGUAGES en lib/languages.ts.';

-- Para añadir un idioma en el futuro hay que tocar los dos sitios: esta
-- restricción y LANGUAGES en lib/languages.ts. Aquí, así:
--
--   alter table public.exam_pages drop constraint exam_pages_language_allowed;
--   alter table public.exam_pages add constraint exam_pages_language_allowed
--     check (language in ('es', 'en', 'fr', 'it', 'pt', 'de', 'nuevo'));
