-- ══════════════════════════════════════════════════════
-- Lucianos Rent-a-Car · Migración: control del negocio
-- SQL Editor → "Run as": postgres → Run. Se puede ejecutar más de una vez.
-- Requiere antes supabase_migracion_2026_10_operacion.sql (el script de cambio limpio las incluye todas).
--
--  1. Roles: Dueño (superusuario) y Administrador (toda la operación). "Empleado" pasa a Administrador.
--  2. Verificación en dos pasos: quien la activa debe usarla para ver datos.
--  3. Bitácora inviolable: registro automático de cada cambio; nadie la puede editar ni borrar.
--  4. Configuración del negocio editable desde la app (solo Dueño).
--  5. Movimientos de caja: apertura (solo Dueño), ingresos, retiros y gastos; no se editan ni borran.
-- ══════════════════════════════════════════════════════

-- ── 1. Roles ──────────────────────────────────────────
do $$ begin
  if to_regclass('auth.users') is not null then
    -- The first time: current administrators become owners (Dueño)
    if not exists (select 1 from auth.users where raw_app_meta_data->>'role' = 'Dueño') then
      update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"Dueño"}'::jsonb
      where raw_app_meta_data->>'role' = 'Administrador';
    end if;
    update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"Administrador"}'::jsonb
    where raw_app_meta_data->>'role' = 'Empleado';
  end if;
end $$;

-- Active user: has a role and, if they turned on two-step verification, used it in this session
create or replace function public.es_empleado() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('Dueño', 'Administrador', 'Empleado'), false)
     and (coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
          or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified'))
$$;
create or replace function public.es_admin() returns boolean language sql stable as $$ select public.es_empleado() $$;
create or replace function public.es_dueno() returns boolean language sql stable as $$
  select public.es_empleado() and (auth.jwt() -> 'app_metadata' ->> 'role') = 'Dueño'
$$;

-- ── 4. Configuración del negocio ──────────────────────
create table if not exists configuracion (
  id              int primary key default 1 check (id = 1),
  datos           jsonb not null default '{}',
  actualizado_por text,
  updated_at      timestamptz not null default now()
);
insert into configuracion (id) values (1) on conflict (id) do nothing;

-- Public page only needs contact details
create or replace function public.datos_publicos() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('nombreComercial', datos->>'nombreComercial', 'telefono', datos->>'telefono',
    'whatsapp', datos->>'whatsapp', 'email', datos->>'email', 'ciudadFirma', datos->>'ciudadFirma')
  from configuracion where id = 1
$$;

-- ── 5. Caja ───────────────────────────────────────────
create table if not exists caja_movimientos (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('apertura', 'ingreso', 'retiro', 'gasto')),
  monto          numeric(10,2) not null check (monto >= 0),
  metodo         text not null default 'efectivo',
  concepto       text,
  fecha          timestamptz not null default now(),
  registrado_por text,
  created_at     timestamptz not null default now()
);
create index if not exists caja_movimientos_fecha_idx on caja_movimientos(fecha);

-- ── 3. Bitácora ───────────────────────────────────────
create table if not exists auditoria (
  id               bigint generated always as identity primary key,
  fecha            timestamptz not null default now(),
  usuario          text,
  tabla            text not null,
  operacion        text not null,
  registro_id      text,
  datos_anteriores jsonb,
  datos_nuevos     jsonb
);
create index if not exists auditoria_fecha_idx on auditoria(fecha desc);

create or replace function public.tg_auditar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria (usuario, tabla, operacion, registro_id, datos_anteriores, datos_nuevos)
  values (coalesce(auth.jwt() ->> 'email', current_user), tg_table_name, lower(tg_op),
          coalesce(case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end, ''),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;

-- Nobody edits or deletes the record from the app (corrections are new entries)
create or replace function public.tg_inmutable() returns trigger language plpgsql as $$
begin
  raise exception 'Este registro es permanente: no se puede modificar ni borrar.';
end $$;

-- Who did it comes from the session, not from what the app sends
create or replace function public.tg_quien() returns trigger language plpgsql as $$
begin
  if auth.jwt() ->> 'email' is not null then
    if tg_table_name = 'logs' then new.realizado_por := auth.jwt() ->> 'email';
    else new.registrado_por := auth.jwt() ->> 'email'; end if;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['reservas', 'pagos', 'vehiculos', 'clientes', 'cotizaciones', 'caja_movimientos', 'configuracion'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists auditar on public.%I', t);
      execute format('create trigger auditar after insert or update or delete on public.%I for each row execute function public.tg_auditar()', t);
    end if;
  end loop;
  foreach t in array array['auditoria', 'logs', 'caja_movimientos'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists inmutable on public.%I', t);
      execute format('create trigger inmutable before update or delete on public.%I for each row execute function public.tg_inmutable()', t);
    end if;
  end loop;
  foreach t in array array['logs', 'caja_movimientos', 'pagos'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists quien on public.%I', t);
      execute format('create trigger quien before insert on public.%I for each row execute function public.tg_quien()', t);
    end if;
  end loop;
end $$;

-- ── Permisos ──────────────────────────────────────────
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('drop policy if exists solo_empleados on public.%I', t.tablename);
    execute format('drop policy if exists empleados_leen on public.%I', t.tablename);
    execute format('drop policy if exists empleados_crean on public.%I', t.tablename);
    execute format('drop policy if exists empleados_editan on public.%I', t.tablename);
    execute format('drop policy if exists admin_borra on public.%I', t.tablename);
    execute format('drop policy if exists dueno_borra on public.%I', t.tablename);
    if t.tablename = 'auditoria' then
      execute format('create policy empleados_leen on public.%I for select to authenticated using (public.es_dueno())', t.tablename);
    elsif t.tablename = 'configuracion' then
      execute format('create policy empleados_leen on public.%I for select to authenticated using (public.es_empleado())', t.tablename);
      execute format('create policy empleados_editan on public.%I for update to authenticated using (public.es_dueno()) with check (public.es_dueno())', t.tablename);
    elsif t.tablename = 'caja_movimientos' then
      execute format('create policy empleados_leen on public.%I for select to authenticated using (public.es_empleado())', t.tablename);
      execute format($p$create policy empleados_crean on public.%I for insert to authenticated with check (public.es_empleado() and (tipo <> 'apertura' or public.es_dueno()))$p$, t.tablename);
    elsif t.tablename = 'logs' then
      execute format('create policy empleados_leen on public.%I for select to authenticated using (public.es_empleado())', t.tablename);
      execute format('create policy empleados_crean on public.%I for insert to authenticated with check (public.es_empleado())', t.tablename);
    else
      execute format('create policy empleados_leen on public.%I for select to authenticated using (public.es_empleado())', t.tablename);
      execute format('create policy empleados_crean on public.%I for insert to authenticated with check (public.es_empleado())', t.tablename);
      execute format('create policy empleados_editan on public.%I for update to authenticated using (public.es_empleado()) with check (public.es_empleado())', t.tablename);
      execute format('create policy dueno_borra on public.%I for delete to authenticated using (public.es_dueno())', t.tablename);
    end if;
  end loop;
end $$;

-- Storage: same rule (active users), document deletion only by the owner
do $$ begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists admin_borra_documentos on storage.objects;
    create policy admin_borra_documentos on storage.objects for delete to authenticated using (bucket_id = 'documentos' and public.es_dueno());
  end if;
end $$;

-- ── Usuarios (solo Dueño) ─────────────────────────────
drop function if exists public.listar_empleados();
create or replace function public.listar_empleados()
returns table (id uuid, email text, nombre text, rol text, creado timestamptz, ultimo_acceso timestamptz,
               confirmado boolean, activo boolean, dos_pasos boolean)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.es_dueno() then raise exception 'Solo el dueño puede ver los usuarios'; end if;
  return query
    select u.id, u.email::text, coalesce(u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'nombre'),
           coalesce(u.raw_app_meta_data->>'role', 'Sin acceso'), u.created_at, u.last_sign_in_at,
           u.email_confirmed_at is not null, (u.banned_until is null or u.banned_until < now()),
           exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified')
    from auth.users u where u.deleted_at is null order by u.created_at;
end $$;

create or replace function public.asignar_rol(uid uuid, rol text) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.es_dueno() then raise exception 'Solo el dueño puede cambiar permisos'; end if;
  if rol = 'Empleado' then rol := 'Administrador'; end if;
  if rol not in ('Dueño', 'Administrador', 'Sin acceso') then raise exception 'Rol no válido'; end if;
  if uid = auth.uid() and rol <> 'Dueño' then raise exception 'No puedes quitarte tu propio rol de dueño'; end if;
  if rol <> 'Dueño' and (select raw_app_meta_data->>'role' from auth.users where id = uid) = 'Dueño'
     and (select count(*) from auth.users where raw_app_meta_data->>'role' = 'Dueño') <= 1 then
    raise exception 'Debe quedar al menos un dueño';
  end if;
  if rol = 'Sin acceso' then
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role' where id = uid;
  else
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', rol) where id = uid;
  end if;
  insert into logs (accion, entidad, entidad_id, descripcion, realizado_por)
  values ('cambiar_rol', 'usuarios', uid::text,
          (select email from auth.users where id = uid) || ' ahora es ' || rol, auth.jwt() ->> 'email');
end $$;

revoke all on function public.listar_empleados() from public, anon;
revoke all on function public.asignar_rol(uuid, text) from public, anon;
grant execute on function public.listar_empleados(), public.asignar_rol(uuid, text), public.es_dueno() to authenticated;
grant execute on function public.datos_publicos() to anon, authenticated;
