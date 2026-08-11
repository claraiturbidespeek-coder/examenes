-- El link del examen deja de escribirse a mano y se construye.
--
-- Confirmado contra el inventario completo de S-Peak (43 filas): el link sigue
-- siempre el mismo patrón, sin excepciones,
--
--   http://my.s-peak.com/user/register?cliente={ID_CLIENTE}&destination=node/{NODE}
--
-- y el node depende solo del idioma, nunca del cliente. Con eso, guardar el link
-- entero en cada fila es guardar cuatro veces lo mismo: basta el ID del cliente
-- (que ya está en la fila) más el node del idioma.
--
-- El mapeo vive aquí y no en el código para que dar de alta el node que falta
-- —alemán— sea un UPDATE en este editor, sin tocar el proyecto ni desplegar.

create table public.language_nodes (
  language   text primary key,

  -- Null significa "todavía no se sabe". El panel bloquea el alta de páginas en
  -- ese idioma mientras siga así, en vez de generar un link roto.
  node       text,

  updated_at timestamptz not null default now(),

  -- Misma lista que exam_pages_language_allowed en 0003 y que LANGUAGES en
  -- lib/languages.ts. Añadir un idioma sigue obligando a tocar los tres sitios.
  constraint language_nodes_language_allowed
    check (language in ('es', 'en', 'fr', 'it', 'pt', 'de')),

  -- El node acaba dentro de la URL como `node/{node}`. Con la columna a null la
  -- restricción no se evalúa, que es justo lo que hace falta para alemán.
  constraint language_nodes_node_format check (node ~ '^[0-9]+$')
);

comment on table public.language_nodes is
  'Idioma -> node del examen en my.s-peak.com. node null = pendiente de averiguar; el panel no deja dar de alta páginas en ese idioma.';

create trigger language_nodes_set_updated_at
  before update on public.language_nodes
  for each row execute function public.set_updated_at();

-- Los cinco nodes confirmados en el inventario, más alemán registrado sin node:
-- no aparece en ninguna de las 43 filas, así que no hay de dónde sacarlo.
insert into public.language_nodes (language, node) values
  ('es', '217195'),
  ('fr', '217192'),
  ('en', '203693'),
  ('it', '217196'),
  ('pt', '217193'),
  ('de', null);

-- Mismo criterio que exam_pages: la página del alumno lee con service_role, el
-- panel con la sesión del usuario, y `anon` no recibe nada.
alter table public.language_nodes enable row level security;

create policy "El equipo lee los nodes"
  on public.language_nodes for select
  to authenticated
  using (public.is_app_admin());

grant all privileges on public.language_nodes to service_role;
grant select on public.language_nodes to authenticated;

-- No hay política ni GRANT de escritura para `authenticated`: el node se cambia
-- desde este editor. Es un dato que se toca una vez cada mucho y que afecta a
-- todas las páginas de un idioma a la vez, así que no vale la pena exponerlo en
-- el panel para que se cambie sin querer.


-- ---------------------------------------------------------------------------
-- exam_pages se adapta a que el link ya no se escriba
-- ---------------------------------------------------------------------------

-- Las páginas dadas de alta desde el panel ya no guardan link: se construye al
-- servirlas. Guardarlo congelaría el node del día del alta, y entonces cambiar
-- un node aquí no arreglaría las páginas que ya existen — que es justo lo que se
-- busca poder hacer.
alter table public.exam_pages alter column destination_url drop not null;

-- Una fila tiene que poder resolver un link por alguna de las dos vías: o trae
-- el suyo explícito, o trae el ID de cliente con el que construirlo. Sin ninguna
-- de las dos es una página que solo puede fallar delante de un alumno.
--
-- Las filas que ya existen cumplen la condición: hasta ahora destination_url era
-- obligatorio, así que ninguna lo tiene a null.
alter table public.exam_pages
  add constraint exam_pages_link_resolvable
  check (destination_url is not null or legacy_client_id is not null);

comment on column public.exam_pages.destination_url is
  'Link explícito del examen. Normalmente null: se construye con legacy_client_id y language_nodes. Si trae valor manda sobre el construido, de modo que una fila que sea excepción (por ejemplo del inventario histórico) sigue funcionando.';

comment on column public.exam_pages.legacy_client_id is
  'ID del cliente en my.s-peak.com. Entra en el link construido como ?cliente=. Dejó de ser solo trazabilidad de la migración: ahora es un dato de funcionamiento.';
