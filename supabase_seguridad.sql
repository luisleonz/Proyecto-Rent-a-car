-- ══════════════════════════════════════════════════════
-- Lucianos Rent-a-Car · Seguridad
-- Ejecutar ANTES de importar los datos de clientes.
-- Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.
--
-- Qué hace:
--  1. Solo usuarios con sesión iniciada (empleados) pueden leer o escribir las tablas.
--     Sin esto, la llave pública del sitio web permite leer todos los datos.
--  2. Deja el almacenamiento "Firma" (firma del arrendador) privado y legible solo por empleados.
--
-- Además, en el panel de Supabase: Authentication → Sign In / Providers →
-- desactivar "Allow new users to sign up", para que nadie pueda crearse una cuenta
-- por su cuenta (los empleados se siguen dando de alta desde el panel).
-- ══════════════════════════════════════════════════════

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('drop policy if exists solo_empleados on public.%I', t.tablename);
    execute format('create policy solo_empleados on public.%I for all to authenticated using (true) with check (true)', t.tablename);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('Firma', 'Firma', false)
on conflict (id) do update set public = false;

drop policy if exists empleados_leen_privado on storage.objects;
drop policy if exists empleados_leen_firma on storage.objects;
create policy empleados_leen_firma on storage.objects
  for select to authenticated using (bucket_id = 'Firma');

-- Después: Storage → Firma → Upload file → subir "firma-arrendador.png" (con ese nombre exacto).
