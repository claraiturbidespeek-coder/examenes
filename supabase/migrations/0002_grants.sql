-- Privilegios de tabla.
--
-- Supabase normalmente concede estos GRANT automáticamente a las tablas nuevas de
-- `public`, pero en este proyecto no ocurrió: tras aplicar 0001, los tres roles
-- (anon, authenticated y service_role) daban 42501 «permission denied». Sin esto
-- ni siquiera la página pública del alumno podía leer, porque service_role salta
-- RLS pero no salta los privilegios de tabla.
--
-- GRANT y RLS son dos capas distintas: GRANT decide si el rol puede tocar la
-- tabla, RLS decide qué filas ve. Aquí se abre la primera; la segunda ya está
-- definida en 0001 y sigue mandando.

-- La página pública lee con service_role, y el alta de admins se hace con ella.
grant all privileges on public.exam_pages to service_role;
grant all privileges on public.app_admins to service_role;

-- El panel opera con la sesión del usuario. Las políticas de 0001 restringen
-- estas operaciones a quien esté en app_admins.
grant select, insert, update, delete on public.exam_pages to authenticated;

-- Solo lectura, y la política limita cada usuario a su propia fila. Nadie se
-- concede permisos a sí mismo desde la aplicación.
grant select on public.app_admins to authenticated;

-- `anon` no recibe nada a propósito. La anon key viaja en el bundle del
-- navegador; sin GRANT, no puede ni intentar leer los destinos de los exámenes.
