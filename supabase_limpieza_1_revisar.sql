-- ══════════════════════════════════════════════════════
-- Limpieza de datos de prueba · PASO 1: REVISAR (no borra nada)
-- SQL Editor → "Run as": postgres → Run
--
-- Lista todo lo que NO vino del respaldo del sistema anterior, que es lo que
-- borraría el PASO 2. Si ves algo real que quieras conservar, no ejecutes el
-- PASO 2 y avísale a quien te ayuda con la app.
-- ══════════════════════════════════════════════════════

select 'vehículo' as tipo, placa as dato, modelo as detalle, created_at::date as creado
from vehiculos where legacy_id is null
union all
select 'cliente', nombre, coalesce(telefono, ''), created_at::date
from clientes where legacy_id is null
union all
select 'reserva', '#' || coalesce(folio::text, '?'), fecha_entrega::text || ' → ' || fecha_devolucion::text, created_at::date
from reservas where legacy_id is null
union all
select 'cotización', id, cliente_nombre, created_at::date
from cotizaciones
order by 1, 4;
