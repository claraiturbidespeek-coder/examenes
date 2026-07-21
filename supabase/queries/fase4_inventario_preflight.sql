-- FASE 4 — Diagnóstico del inventario ANTES de cargar nada.
--
-- Todo lo de aquí es de solo lectura: ninguna consulta escribe en exam_pages.
-- El objetivo es ver qué rechazaría la base de datos, porque las restricciones
-- abortan la transacción entera: en un INSERT masivo, una sola fila mala tumba
-- la carga completa y no queda registro de cuál era.
--
-- SUPUESTO: el inventario está cargado en una tabla temporal llamada
-- `inventario_staging` con columnas de texto sin restricciones, por ejemplo:
--
--   create table inventario_staging (
--     client_slug       text,
--     language          text,
--     client_name       text,
--     destination_url   text,
--     legacy_client_id  text,
--     old_wordpress_url text
--   );
--
-- Si tus columnas se llaman distinto, cambia los nombres aquí; la lógica no
-- depende de nada más.


-- 1. LO QUE PEDISTE: qué códigos de idioma distintos hay, y cuáles pasarían.
--    Esta es la que hay que mirar primero.
select
  language                                            as codigo,
  count(*)                                            as filas,
  case
    when language in ('es','en','fr','it','pt','de') then 'OK'
    else 'RECHAZADO por exam_pages_language_allowed'
  end                                                 as veredicto
from inventario_staging
group by language
order by veredicto, filas desc;


-- 2. Los mismos códigos rechazados, con una propuesta de traducción.
--    Sirve para escribir el UPDATE de normalización con criterio en vez de a
--    ojo. Revisa la columna `sugerencia` antes de fiarte: 'pt-br' se propone
--    como 'pt', y esa es una decisión de negocio, no técnica.
select distinct
  language                                            as codigo_original,
  case lower(btrim(language))
    when 'esp'   then 'es'
    when 'spa'   then 'es'
    when 'cas'   then 'es'
    when 'ing'   then 'en'
    when 'eng'   then 'en'
    when 'fra'   then 'fr'
    when 'fre'   then 'fr'
    when 'ita'   then 'it'
    when 'por'   then 'pt'
    when 'pt-br' then 'pt'
    when 'pt_br' then 'pt'
    when 'ale'   then 'de'
    when 'ger'   then 'de'
    when 'deu'   then 'de'
    else lower(btrim(language))
  end                                                 as sugerencia
from inventario_staging
where language not in ('es','en','fr','it','pt','de')
order by codigo_original;


-- 3. Duplicados DENTRO del propio inventario.
--    exam_pages tiene UNIQUE (client_slug, language): si el fichero trae dos
--    filas para el mismo par, la carga falla aunque cada fila sea válida por
--    separado. Y hay que decidir cuál de las dos vale.
select
  lower(btrim(client_slug))                           as client_slug,
  lower(btrim(language))                              as language,
  count(*)                                            as veces,
  array_agg(distinct destination_url)                 as destinos_distintos
from inventario_staging
group by 1, 2
having count(*) > 1
order by veces desc;


-- 4. Pares que YA existen en exam_pages.
--    Colisionarían con lo que el equipo haya dado de alta a mano desde el panel.
select
  i.client_slug,
  i.language,
  e.destination_url                                   as destino_actual_en_bd,
  i.destination_url                                   as destino_en_inventario
from inventario_staging i
join exam_pages e
  on e.client_slug = lower(btrim(i.client_slug))
 and e.language    = lower(btrim(i.language))
order by i.client_slug;


-- 5. Todo lo demás que la base de datos rechazaría, en una sola lista.
--    Cada fila es un motivo distinto de fallo; una misma fila puede salir varias
--    veces si incumple varias cosas.
select 'slug con formato inválido' as motivo, client_slug as valor, count(*) as filas
from inventario_staging
where lower(btrim(client_slug)) !~ '^[a-z0-9-]+$'
group by client_slug

union all
select 'slug reservado por la app', client_slug, count(*)
from inventario_staging
where lower(btrim(client_slug)) in ('admin','api','login','_next','robots.txt')
group by client_slug

union all
select 'URL sin http:// ni https://', destination_url, count(*)
from inventario_staging
where destination_url !~* '^https?://'
group by destination_url

union all
select 'campo obligatorio vacío', coalesce(client_slug, '(client_slug nulo)'), count(*)
from inventario_staging
where client_slug is null or btrim(client_slug) = ''
   or language is null or btrim(language) = ''
   or client_name is null or btrim(client_name) = ''
   or destination_url is null or btrim(destination_url) = ''
group by 2

order by motivo, filas desc;


-- 6. Resumen: cuántas filas entrarían limpias si cargaras ahora mismo.
select
  count(*)                                                        as filas_totales,
  count(*) filter (
    where lower(btrim(language)) in ('es','en','fr','it','pt','de')
      and lower(btrim(client_slug)) ~ '^[a-z0-9-]+$'
      and lower(btrim(client_slug)) not in ('admin','api','login','_next','robots.txt')
      and destination_url ~* '^https?://'
      and btrim(coalesce(client_name, '')) <> ''
  )                                                               as filas_que_pasarian,
  count(distinct (lower(btrim(client_slug)), lower(btrim(language)))) as pares_unicos
from inventario_staging;
