-- ══════════════════════════════════════════════════════
-- Lucianos Rent-a-Car · Migración: IVA, pagos y datos del sistema anterior
-- Se incluye automáticamente al inicio del script de importación.
-- Es seguro ejecutarla más de una vez.
-- ══════════════════════════════════════════════════════

-- ── IVA (se suma al final; las tarifas no lo incluyen) ──
alter table reservas     add column if not exists iva numeric(10,2) not null default 0;
alter table cotizaciones add column if not exists iva numeric(10,2) not null default 0;

-- ── Clientes ──────────────────────────────────────────
alter table clientes
  add column if not exists fecha_nacimiento        date,
  add column if not exists nacionalidad            text,
  add column if not exists contacto_emergencia     text,
  add column if not exists contacto_emergencia_tel text,
  add column if not exists notas                   text,
  add column if not exists legacy_id               text;   -- id en el sistema anterior

-- ── Vehículos ─────────────────────────────────────────
alter table vehiculos
  add column if not exists foto_url  text,
  add column if not exists legacy_id text;

-- ── Reservas: estado del vehículo al salir y regresar ──
alter table reservas
  add column if not exists km_salida           int,
  add column if not exists km_regreso          int,
  add column if not exists combustible_salida  int,   -- 0 a 100
  add column if not exists combustible_regreso int,
  add column if not exists devuelto_at         timestamptz,
  add column if not exists legacy_id           text;

create unique index if not exists clientes_legacy_key  on clientes(legacy_id);
create unique index if not exists vehiculos_legacy_key on vehiculos(legacy_id);
create unique index if not exists reservas_legacy_key  on reservas(legacy_id);

-- ── Pagos recibidos por cada renta ────────────────────
create table if not exists pagos (
  id             uuid primary key default gen_random_uuid(),
  reserva_id     uuid not null references reservas(id) on delete cascade,
  monto          numeric(10,2) not null,
  metodo         text,                               -- efectivo | tarjeta | transferencia
  concepto       text not null default 'renta',
  fecha          timestamptz not null default now(),
  notas          text,
  registrado_por text,
  legacy_id      text unique,
  created_at     timestamptz not null default now()
);
create index if not exists pagos_reserva_idx on pagos(reserva_id);

alter table pagos enable row level security;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    drop policy if exists solo_empleados on pagos;
    create policy solo_empleados on pagos for all to authenticated using (true) with check (true);
  end if;
end $$;
