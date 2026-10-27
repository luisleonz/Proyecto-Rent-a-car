-- ══════════════════════════════════════════════════════
-- Lucianos Rent-a-Car · Migración: operación diaria
-- SQL Editor → "Run as": postgres → Run. Se puede ejecutar más de una vez.
--
--  1. Entrega y devolución: kilometraje, gasolina, fotos, daños, firma, cargos y fianza.
--  2. Vehículos: varias fotos, vencimientos (seguro, tarjeta, verificación) y servicio.
--  3. Estado de cada vehículo calculado solo a partir de sus reservas.
--  4. Roles seguros: el rol vive donde el usuario no lo puede cambiar.
--  5. Permisos: solo cuentas activadas (Empleado/Administrador) ven datos;
--     solo administradores borran datos o aprueban solicitudes.
--  6. Almacenamiento de fotos de vehículos (público) y de documentos (privado).
--  7. Funciones para la pantalla de Empleados y la página pública de autos.
-- ══════════════════════════════════════════════════════

-- ── 1. Entrega y devolución ───────────────────────────
alter table reservas
  add column if not exists entregado_at       timestamptz,
  add column if not exists entregado_por      text,
  add column if not exists recibido_por       text,
  add column if not exists fotos_entrega      jsonb not null default '[]',
  add column if not exists fotos_devolucion   jsonb not null default '[]',
  add column if not exists danos_entrega      text,
  add column if not exists danos_devolucion   text,
  add column if not exists firma_cliente      text,          -- ruta en almacenamiento "documentos"
  add column if not exists cargos_extra       numeric(10,2) not null default 0,
  add column if not exists cargos_detalle     jsonb,
  add column if not exists fianza_devuelta    numeric(10,2),
  add column if not exists fianza_devuelta_at timestamptz;

-- ── 2. Vehículos ──────────────────────────────────────
alter table vehiculos
  add column if not exists fotos               jsonb not null default '[]',
  add column if not exists seguro_vence        date,
  add column if not exists tarjeta_vence       date,
  add column if not exists verificacion_vence  date,
  add column if not exists servicio_cada_km    int,
  add column if not exists ultimo_servicio_km  int,
  add column if not exists notas               text;

-- ── 3. Estado del vehículo según sus reservas ─────────
-- rentado: tiene una renta entregada · reservado: sale hoy o mañana (o debió salir) ·
-- taller: lo decide el usuario y no se toca · disponible: lo demás
create or replace function public.sincronizar_vehiculo(vid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  hoy date := (now() at time zone 'America/Hermosillo')::date;
  actual text;
  r record;
begin
  select status into actual from vehiculos where id = vid;
  if actual is null or actual = 'taller' then return; end if;

  select res.fecha_devolucion, c.nombre into r
  from reservas res left join clientes c on c.id = res.cliente_id
  where res.vehiculo_id = vid and res.status = 'entregada'
  order by res.fecha_entrega desc limit 1;
  if found then
    update vehiculos set status = 'rentado', cliente_actual = r.nombre,
      info_cliente = 'regresa ' || to_char(r.fecha_devolucion, 'DD/MM') where id = vid;
    return;
  end if;

  select res.fecha_entrega, c.nombre into r
  from reservas res left join clientes c on c.id = res.cliente_id
  where res.vehiculo_id = vid and res.status in ('confirmada', 'pendiente') and res.fecha_entrega <= hoy + 1
  order by res.fecha_entrega limit 1;
  if found then
    update vehiculos set status = 'reservado', cliente_actual = r.nombre,
      info_cliente = 'sale ' || to_char(r.fecha_entrega, 'DD/MM') where id = vid;
    return;
  end if;

  update vehiculos set status = 'disponible', cliente_actual = null, info_cliente = null where id = vid;
end $$;

create or replace function public.sincronizar_flota() returns void
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  for v in select id from vehiculos loop perform sincronizar_vehiculo(v.id); end loop;
end $$;

create or replace function public.tg_reserva_sincroniza() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.vehiculo_id is not null then perform sincronizar_vehiculo(old.vehiculo_id); end if;
  if tg_op in ('INSERT', 'UPDATE') and new.vehiculo_id is not null
     and (tg_op = 'INSERT' or new.vehiculo_id is distinct from old.vehiculo_id or new.status is distinct from old.status
          or new.fecha_entrega is distinct from old.fecha_entrega) then
    perform sincronizar_vehiculo(new.vehiculo_id);
  end if;
  return null;
end $$;

drop trigger if exists reserva_sincroniza_vehiculo on reservas;
create trigger reserva_sincroniza_vehiculo after insert or update or delete on reservas
  for each row execute function public.tg_reserva_sincroniza();

-- ── 4. Roles seguros ──────────────────────────────────
-- El rol se guardaba en datos que el propio usuario puede editar; se copia a donde solo un administrador puede.
do $$ begin
  if to_regclass('auth.users') is not null then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', raw_user_meta_data->>'role')
    where raw_user_meta_data->>'role' is not null and (raw_app_meta_data->>'role') is null;
    -- Everyone who already had an account keeps access as Empleado
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"Empleado"}'::jsonb
    where (raw_app_meta_data->>'role') is null;
  end if;
end $$;

create or replace function public.es_admin() returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'Administrador', false)
$$;

-- New accounts (e.g. someone signing up on their own) have no role and see nothing until an admin enables them
create or replace function public.es_empleado() returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('Empleado', 'Administrador'), false)
$$;

-- ── 5. Permisos por rol en todas las tablas ───────────
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
    execute format('create policy empleados_leen on public.%I for select to authenticated using (public.es_empleado())', t.tablename);
    execute format('create policy empleados_crean on public.%I for insert to authenticated with check (public.es_empleado())', t.tablename);
    execute format('create policy admin_borra on public.%I for delete to authenticated using (public.es_admin())', t.tablename);
    if t.tablename = 'solicitudes' then
      execute format('create policy empleados_editan on public.%I for update to authenticated using (public.es_admin()) with check (public.es_admin())', t.tablename);
    else
      execute format('create policy empleados_editan on public.%I for update to authenticated using (public.es_empleado()) with check (public.es_empleado())', t.tablename);
    end if;
  end loop;
end $$;

-- ── 6. Almacenamiento ─────────────────────────────────
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('vehiculos', 'vehiculos', true)
      on conflict (id) do update set public = true;
    insert into storage.buckets (id, name, public) values ('documentos', 'documentos', false)
      on conflict (id) do update set public = false;

    drop policy if exists empleados_suben_vehiculos on storage.objects;
    drop policy if exists empleados_cambian_vehiculos on storage.objects;
    drop policy if exists empleados_borran_vehiculos on storage.objects;
    drop policy if exists empleados_leen_documentos on storage.objects;
    drop policy if exists empleados_suben_documentos on storage.objects;
    drop policy if exists admin_borra_documentos on storage.objects;
    create policy empleados_suben_vehiculos on storage.objects for insert to authenticated with check (bucket_id = 'vehiculos' and public.es_empleado());
    create policy empleados_cambian_vehiculos on storage.objects for update to authenticated using (bucket_id = 'vehiculos' and public.es_empleado());
    create policy empleados_borran_vehiculos on storage.objects for delete to authenticated using (bucket_id = 'vehiculos' and public.es_empleado());
    create policy empleados_leen_documentos on storage.objects for select to authenticated using (bucket_id = 'documentos' and public.es_empleado());
    create policy empleados_suben_documentos on storage.objects for insert to authenticated with check (bucket_id = 'documentos' and public.es_empleado());
    drop policy if exists empleados_leen_firma on storage.objects;
    create policy empleados_leen_firma on storage.objects for select to authenticated using (bucket_id = 'Firma' and public.es_empleado());
    create policy admin_borra_documentos on storage.objects for delete to authenticated using (bucket_id = 'documentos' and public.es_admin());
  end if;
end $$;

-- ── 7. Empleados (solo administradores) ───────────────
create or replace function public.listar_empleados()
returns table (id uuid, email text, nombre text, rol text, creado timestamptz, ultimo_acceso timestamptz, confirmado boolean)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  return query
    select u.id, u.email::text, coalesce(u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'nombre'),
           coalesce(u.raw_app_meta_data->>'role', 'Sin acceso'), u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null
    from auth.users u where u.deleted_at is null order by u.created_at;
end $$;

create or replace function public.asignar_rol(uid uuid, rol text) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.es_admin() then raise exception 'Solo administradores'; end if;
  if rol not in ('Administrador', 'Empleado', 'Sin acceso') then raise exception 'Rol no válido'; end if;
  if uid = auth.uid() and rol <> 'Administrador' then raise exception 'No puedes quitarte tu propio rol de administrador'; end if;
  if rol = 'Sin acceso' then
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role' where id = uid;
  else
    update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', rol) where id = uid;
  end if;
end $$;

-- ── Página pública: solo datos de exhibición de los autos ──
create or replace function public.vehiculos_publicos()
returns table (id uuid, modelo text, anio int, segmento text, transmision text, asientos int,
               tarifa_diaria numeric, foto_url text, disponible_hoy boolean)
language sql stable security definer set search_path = public as $$
  select v.id, v.modelo, v.anio, v.segmento, v.transmision, v.asientos, v.tarifa_diaria, v.foto_url,
         v.status = 'disponible'
  from vehiculos v where v.status <> 'taller' order by v.tarifa_diaria nulls last, v.modelo
$$;

revoke all on function public.sincronizar_vehiculo(uuid) from public, anon;
revoke all on function public.sincronizar_flota() from public, anon;
revoke all on function public.listar_empleados() from public, anon;
revoke all on function public.asignar_rol(uuid, text) from public, anon;
grant execute on function public.sincronizar_vehiculo(uuid), public.sincronizar_flota(),
  public.listar_empleados(), public.asignar_rol(uuid, text) to authenticated;
grant execute on function public.vehiculos_publicos() to anon, authenticated;

select public.sincronizar_flota();
