-- Páginas de acceso a exámenes de S-Peak.
--
-- Cada fila mapea una combinación cliente + idioma (la URL pública, ej. /cimesa/es)
-- al enlace real del examen. La indirección permite cambiar el examen de sitio sin
-- reenviar comunicaciones a los alumnos.

create extension if not exists pgcrypto;

create table public.exam_pages (
  id                uuid primary key default gen_random_uuid(),

  -- Los dos segmentos de la URL pública: /{client_slug}/{language}
  client_slug       text not null,
  language          text not null,

  -- Nombre para mostrar al alumno, ej. "CIMESA"
  client_name       text not null,
  destination_url   text not null,

  -- Trazabilidad con el inventario de migración. Nullable a propósito: no se piden
  -- en el formulario del admin, se rellenan solo para las páginas que vienen del
  -- sitio antiguo. Que estén vacías en filas nuevas es lo esperado.
  legacy_client_id  text,
  old_wordpress_url text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- La combinación que resuelve la URL. Sin esto, dos filas para el mismo
  -- cliente+idioma harían impredecible a qué examen llega el alumno.
  constraint exam_pages_slug_language_key unique (client_slug, language),

  -- Los slugs acaban en una URL, así que se restringen en la base de datos y no
  -- solo en el formulario: nada que se guarde puede romper el routing.
  constraint exam_pages_client_slug_format check (client_slug ~ '^[a-z0-9-]+$'),
  constraint exam_pages_language_format check (language ~ '^[a-z0-9-]+$'),
  constraint exam_pages_destination_url_scheme check (destination_url ~* '^https?://'),

  -- Rutas propias de la app. Un cliente llamado "admin" haría que /admin/es
  -- pareciera una página de examen y confundiría el panel con el sitio público.
  constraint exam_pages_client_slug_reserved check (
    client_slug not in ('admin', 'api', 'login', '_next', 'robots.txt')
  )
);

comment on column public.exam_pages.legacy_client_id is
  'Solo trazabilidad con el inventario de migración. No se edita desde el admin.';
comment on column public.exam_pages.old_wordpress_url is
  'URL en el WordPress antiguo. Solo trazabilidad de migración, no se usa en runtime.';

-- Mantiene updated_at honesto sin depender de que la app se acuerde de mandarlo.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger exam_pages_set_updated_at
  before update on public.exam_pages
  for each row execute function public.set_updated_at();

-- Quién es del equipo de S-Peak.
--
-- No basta con exigir "usuario autenticado": el registro público de Supabase Auth
-- puede estar abierto, y la anon key viaja en el bundle del navegador. Sin esta
-- tabla, cualquiera podría registrarse solo y quedar autorizado. Estar en
-- auth.users da identidad; estar aquí da permiso.
--
-- Solo se escribe con service_role: no hay política que permita a un usuario
-- añadirse a sí mismo.
create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create policy "Los admins se ven a sí mismos"
  on public.app_admins for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- RLS: sin política para `anon`.
--
-- La página pública lee desde el servidor con la service_role key (que salta RLS),
-- así que no hace falta acceso anónimo. Dejarlo cerrado significa que la anon key
-- expuesta en el navegador no puede enumerar los destination_url de todos los
-- clientes. El admin escribe con su sesión, por lo que la propia base de datos
-- rechaza escrituras de quien no esté en app_admins — la protección no depende
-- solo del middleware.
alter table public.exam_pages enable row level security;

create policy "El equipo lee las páginas"
  on public.exam_pages for select
  to authenticated
  using (public.is_app_admin());

create policy "El equipo crea páginas"
  on public.exam_pages for insert
  to authenticated
  with check (public.is_app_admin());

create policy "El equipo edita páginas"
  on public.exam_pages for update
  to authenticated
  using (public.is_app_admin()) with check (public.is_app_admin());

create policy "El equipo borra páginas"
  on public.exam_pages for delete
  to authenticated
  using (public.is_app_admin());
