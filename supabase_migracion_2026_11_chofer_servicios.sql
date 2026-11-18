-- ═══════════════════════════════════════════════════════════════════
--  Rentas con chofer y otros servicios
--  Ejecutar en Supabase → SQL Editor (Run as: postgres). Se puede ejecutar varias veces.
--  · con_chofer / chofer_nombre / chofer_costo: la renta incluye chofer; el cobro se escribe
--    a mano porque cambia según el chofer, los días y las fechas festivas.
--  · servicios: otros conceptos que se cobran en ocasiones, escritos a mano
--    (lista de {concepto, monto}). Con el tiempo se pueden revisar en Reportes y volver fijos.
--  Todo esto ya va sumado en el total de la reserva.
-- ═══════════════════════════════════════════════════════════════════
alter table reservas add column if not exists con_chofer    boolean not null default false;
alter table reservas add column if not exists chofer_nombre text;
alter table reservas add column if not exists chofer_costo  numeric(10,2) not null default 0;
alter table reservas add column if not exists servicios     jsonb not null default '[]'::jsonb;

do $$ begin
  alter table reservas add constraint reservas_chofer_costo_check check (chofer_costo >= 0);
exception when duplicate_object then null; end $$;
