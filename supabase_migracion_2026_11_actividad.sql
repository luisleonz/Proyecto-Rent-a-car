-- ═══════════════════════════════════════════════════════════════════
--  Historial de cambios más preciso
--  Ejecutar en Supabase → SQL Editor (Run as: postgres), después de
--  supabase_migracion_2026_11_control.sql. Se puede ejecutar varias veces.
--
--  · El estado automático de los vehículos (disponible / reservado / rentado) solo
--    se escribe cuando de verdad cambia, y queda registrado como "automático",
--    no a nombre de la persona que abrió la pantalla.
--  · El historial ya no guarda "cambios" en los que no cambió ningún dato.
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.tg_auditar() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) - 'updated_at' end;
  despues jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) - 'updated_at' end;
begin
  -- Saving the same values is not a change
  if tg_op = 'UPDATE' and antes = despues then return null; end if;
  insert into auditoria (usuario, tabla, operacion, registro_id, datos_anteriores, datos_nuevos)
  values (case when coalesce(current_setting('app.automatico', true), '') = 'si' then 'automático'
               else coalesce(auth.jwt() ->> 'email', current_user) end,
          tg_table_name, lower(tg_op),
          coalesce(case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end, ''),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;

-- rentado: tiene una renta entregada · reservado: sale hoy o mañana (o debió salir y sus fechas siguen vigentes) ·
-- taller: lo decide el usuario y no se toca · disponible: lo demás
create or replace function public.sincronizar_vehiculo(vid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  hoy date := (now() at time zone 'America/Hermosillo')::date;
  actual text;
  r record;
  n_status text; n_cliente text; n_info text;
begin
  select status into actual from vehiculos where id = vid;
  if actual is null or actual = 'taller' then return; end if;

  select res.fecha_devolucion, c.nombre into r
  from reservas res left join clientes c on c.id = res.cliente_id
  where res.vehiculo_id = vid and res.status = 'entregada'
  order by res.fecha_entrega desc limit 1;
  if found then
    n_status := 'rentado'; n_cliente := r.nombre; n_info := 'regresa ' || to_char(r.fecha_devolucion, 'DD/MM');
  else
    select res.fecha_entrega, c.nombre into r
    from reservas res left join clientes c on c.id = res.cliente_id
    where res.vehiculo_id = vid and res.status in ('confirmada', 'pendiente') and res.fecha_entrega <= hoy + 1
      and res.fecha_devolucion >= hoy   -- a pickup that never happened and whose dates passed doesn't block the car
    order by res.fecha_entrega limit 1;
    if found then
      n_status := 'reservado'; n_cliente := r.nombre; n_info := 'sale ' || to_char(r.fecha_entrega, 'DD/MM');
    else
      n_status := 'disponible'; n_cliente := null; n_info := null;
    end if;
  end if;

  -- Only write (and record) when something actually changes; it is the app, not a person
  perform set_config('app.automatico', 'si', true);
  update vehiculos set status = n_status, cliente_actual = n_cliente, info_cliente = n_info
  where id = vid and (status, cliente_actual, info_cliente) is distinct from (n_status, n_cliente, n_info);
  perform set_config('app.automatico', '', true);
end $$;
