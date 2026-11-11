-- ═══════════════════════════════════════════════════════════════════
--  Revisión del estado de la base de datos (SOLO LECTURA: no cambia nada)
--  Ejecutar en Supabase → SQL Editor (Run as: postgres) y revisar la tabla de resultados.
--  Cada fila es un dato; "revisar" en la última columna marca lo que conviene atender.
-- ═══════════════════════════════════════════════════════════════════
with hoy as (select (now() at time zone 'America/Hermosillo')::date as d),
r as (select res.*, c.nombre cliente, v.modelo, v.placa from reservas res
      left join clientes c on c.id = res.cliente_id left join vehiculos v on v.id = res.vehiculo_id)
select * from (
  -- 1. Actualizaciones aplicadas
  select 1 orden, 'Actualizaciones' seccion, 'Clientes no deseados' dato,
         case when to_regclass('public.clientes_vetos') is not null then 'aplicada' else 'FALTA' end valor,
         case when to_regclass('public.clientes_vetos') is null then 'revisar' end atencion
  union all
  select 1, 'Actualizaciones', 'Historial preciso (actividad)',
         case when pg_get_functiondef('public.tg_auditar'::regproc) like '%app.automatico%' then 'aplicada' else 'FALTA' end,
         case when pg_get_functiondef('public.tg_auditar'::regproc) not like '%app.automatico%' then 'revisar' end
  union all
  select 1, 'Actualizaciones', 'Permiso para leer la firma del arrendador',
         case when exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'empleados_leen_firma_arrendador') then 'aplicada' else 'FALTA' end,
         case when not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'empleados_leen_firma_arrendador') then 'revisar' end

  -- 2. Flota
  union all select 2, 'Flota', 'Vehículos ' || status, count(*)::text, null from vehiculos group by status
  union all select 2, 'Flota', 'Vehículos sin tarifa diaria', count(*)::text, case when count(*) > 0 then 'revisar' end from vehiculos where coalesce(tarifa_diaria, 0) = 0
  union all select 2, 'Flota', 'Vehículos sin foto', count(*)::text, null from vehiculos where foto_url is null

  -- 3. Clientes
  union all select 3, 'Clientes', 'Total', count(*)::text, null from clientes
  union all select 3, 'Clientes', 'Marcados como no deseados', count(*)::text, null from clientes where no_rentar
  union all select 3, 'Clientes', 'Teléfonos repetidos (posibles duplicados)', count(*)::text, case when count(*) > 0 then 'revisar' end
    from (select right(regexp_replace(telefono, '\D', '', 'g'), 10) t from clientes where length(regexp_replace(coalesce(telefono, ''), '\D', '', 'g')) >= 10
          group by 1 having count(*) > 1) x

  -- 4. Rentas
  union all select 4, 'Rentas', 'Reservas ' || status, count(*)::text, null from reservas group by status
  union all select 4, 'Rentas', 'En renta ahora (entregadas)', count(*)::text, null from reservas where status = 'entregada'
  union all select 4, 'Rentas', 'Próximas (salen en 14 días)', count(*)::text, null from reservas, hoy where status in ('pendiente', 'confirmada') and fecha_entrega between hoy.d and hoy.d + 14
  union all select 4, 'Rentas', 'Atrasadas: debieron regresar · #' || coalesce(folio::text, '?') || ' ' || coalesce(cliente, '') || ' · ' || coalesce(modelo, ''),
                   to_char(fecha_devolucion, 'DD/MM/YYYY'), 'revisar' from r, hoy where status = 'entregada' and fecha_devolucion < hoy.d
  union all select 4, 'Rentas', 'No salieron: fecha de entrega pasada · #' || coalesce(folio::text, '?') || ' ' || coalesce(cliente, ''),
                   to_char(fecha_entrega, 'DD/MM/YYYY'), 'revisar' from r, hoy where status in ('pendiente', 'confirmada') and fecha_entrega < hoy.d
  union all select 4, 'Rentas', 'Empalmes: mismo auto con dos rentas a la vez · ' || a.modelo || ' #' || a.folio || ' y #' || b.folio,
                   to_char(greatest(a.fecha_entrega, b.fecha_entrega), 'DD/MM'), 'revisar'
    from r a join r b on a.vehiculo_id = b.vehiculo_id and a.id < b.id
    where a.status in ('pendiente', 'confirmada', 'entregada') and b.status in ('pendiente', 'confirmada', 'entregada')
      and a.fecha_entrega < b.fecha_devolucion and b.fecha_entrega < a.fecha_devolucion
  union all select 4, 'Rentas', 'Reservas próximas con auto en taller · #' || coalesce(r.folio::text, '?') || ' ' || coalesce(r.modelo, ''),
                   to_char(r.fecha_entrega, 'DD/MM'), 'revisar'
    from r join vehiculos v on v.id = r.vehiculo_id, hoy where r.status in ('pendiente', 'confirmada') and v.status = 'taller' and r.fecha_entrega <= hoy.d + 15
  union all select 4, 'Rentas', 'Reservas de clientes no deseados (próximas) · #' || coalesce(r.folio::text, '?') || ' ' || r.cliente,
                   to_char(r.fecha_entrega, 'DD/MM'), 'revisar'
    from r join clientes c on c.id = r.cliente_id where c.no_rentar and r.status in ('pendiente', 'confirmada', 'entregada')
  union all select 4, 'Rentas', 'Siguiente número de contrato',
                   (select (last_value + 1)::text from pg_sequences where schemaname = 'public' and sequencename like 'reservas_folio%'), null

  -- 5. Dinero
  union all select 5, 'Dinero', 'Saldo por cobrar (rentas en curso y próximas)',
                   to_char(coalesce(sum(greatest(total - deposito, 0)), 0), 'FM$999,999,990'), null
    from reservas where status in ('pendiente', 'confirmada', 'entregada')
  union all select 5, 'Dinero', 'Adeudos de rentas terminadas',
                   to_char(coalesce(sum(greatest(total - deposito, 0)), 0), 'FM$999,999,990'),
                   case when coalesce(sum(greatest(total - deposito, 0)), 0) > 0 then 'revisar' end
    from reservas where status = 'devuelta'
  union all select 5, 'Dinero', 'Pagado según reservas ≠ suma de pagos · #' || coalesce(x.folio::text, '?'),
                   to_char(x.deposito, 'FM$999,999,990') || ' vs ' || to_char(x.pagos, 'FM$999,999,990'), 'revisar'
    from (select res.folio, res.deposito, coalesce(sum(p.monto) filter (where p.concepto in ('renta', 'cargo_extra')), 0) pagos
          from reservas res left join pagos p on p.reserva_id = res.id
          where res.status <> 'cancelada' group by res.id, res.folio, res.deposito) x
    where abs(x.deposito - x.pagos) >= 1
  union all select 5, 'Dinero', 'Pagos registrados en la app (' || to_char(date_trunc('month', fecha), 'MM/YYYY') || ')',
                   count(*) || ' · ' || to_char(sum(case when concepto = 'devolucion_fianza' then -monto else monto end), 'FM$999,999,990'), null
    from pagos where legacy_id is null group by date_trunc('month', fecha)
  union all select 5, 'Dinero', 'Último fondo de caja',
                   coalesce((select to_char(monto, 'FM$999,999,990') || ' el ' || to_char(fecha at time zone 'America/Hermosillo', 'DD/MM HH24:MI')
                             from caja_movimientos where tipo = 'apertura' order by fecha desc limit 1), 'sin registrar'),
                   case when not exists (select 1 from caja_movimientos where tipo = 'apertura') then 'revisar' end
  union all select 5, 'Dinero', 'Movimientos de caja (entradas, retiros, gastos)', count(*)::text, null from caja_movimientos where tipo <> 'apertura'

  -- 6. Usuarios y seguridad
  union all select 6, 'Usuarios', coalesce(raw_app_meta_data ->> 'role', 'Sin acceso') ||
                   case when banned_until > now() then ' (desactivados)' else '' end, count(*)::text, null
    from auth.users where deleted_at is null group by 2, 3
  union all select 6, 'Usuarios', 'Con verificación en dos pasos', count(distinct user_id)::text, null from auth.mfa_factors where status = 'verified'
  union all select 6, 'Usuarios', 'Invitaciones sin aceptar', count(*)::text, null from auth.users where email_confirmed_at is null and deleted_at is null
  union all select 6, 'Usuarios', 'Tablas sin seguridad (RLS apagado)', count(*)::text, case when count(*) > 0 then 'revisar' end
    from pg_tables where schemaname = 'public' and not rowsecurity

  -- 7. Actividad (últimos 7 días)
  union all select 7, 'Actividad', 'Acciones registradas', count(*)::text, null from logs where created_at > now() - interval '7 days'
  union all select 7, 'Actividad', 'Cambios detallados', count(*)::text, null from auditoria where fecha > now() - interval '7 days'
  union all select 7, 'Actividad', 'Cambios vacíos (no deberían aparecer tras la actualización)', count(*)::text,
                   case when count(*) > 0 then 'revisar' end
    from auditoria where operacion = 'update' and fecha > now() - interval '1 day'
      and (datos_anteriores - 'updated_at') = (datos_nuevos - 'updated_at')
) t
order by orden, seccion, atencion nulls last, dato;
