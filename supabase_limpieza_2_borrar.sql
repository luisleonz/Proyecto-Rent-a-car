-- ══════════════════════════════════════════════════════
-- Limpieza de datos de prueba · PASO 2: BORRAR
-- SQL Editor → "Run as": postgres → Run
--
-- Borra lo que NO vino del respaldo del sistema anterior (revíselo antes con el PASO 1):
--   · reservas, clientes y vehículos de prueba
--   · todas las cotizaciones (el sistema anterior no tenía; todas son de prueba)
--   · solicitudes de cambio y registro de actividad de las pruebas
-- Lo importado del respaldo no se toca. Si algo falla, no se borra nada.
-- ══════════════════════════════════════════════════════

begin;

create temp table _reservas_prueba on commit drop as
select id from reservas where legacy_id is null;

do $$ begin
  if to_regclass('public.movimientos_caja') is not null then
    execute 'delete from movimientos_caja where reserva_id in (select id from _reservas_prueba)';
  end if;
  if to_regclass('public.solicitudes') is not null then execute 'delete from solicitudes'; end if;
  if to_regclass('public.logs')        is not null then execute 'delete from logs'; end if;
end $$;

delete from cotizaciones;
delete from reservas where id in (select id from _reservas_prueba);   -- sus pagos se borran solos
delete from clientes  c where legacy_id is null and not exists (select 1 from reservas r where r.cliente_id  = c.id);
delete from vehiculos v where legacy_id is null and not exists (select 1 from reservas r where r.vehiculo_id = v.id);

-- El siguiente contrato continúa después del último del sistema anterior
select setval(pg_get_serial_sequence('public.reservas', 'folio'), (select coalesce(max(folio), 1) from reservas));

commit;

select
  (select count(*) from vehiculos) as vehiculos,
  (select count(*) from clientes)  as clientes,
  (select count(*) from reservas)  as reservas,
  (select count(*) from pagos)     as pagos,
  (select max(folio) + 1 from reservas) as siguiente_contrato;
