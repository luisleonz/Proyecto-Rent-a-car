-- ══════════════════════════════════════════════════════
-- Lucianos Rent-a-Car · Schema inicial
-- Ejecutar en: Supabase → SQL Editor → New query
-- ══════════════════════════════════════════════════════

-- ── Extensión para UUIDs ──────────────────────────────
create extension if not exists "pgcrypto";

-- ── Empleados ─────────────────────────────────────────
create table if not exists empleados (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  nombre     text not null,
  apellido   text not null,
  rol        text not null default 'operativo'
               check (rol in ('administrador','operativo','cajero')),
  sucursal   text,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Vehículos ─────────────────────────────────────────
create table if not exists vehiculos (
  id              uuid primary key default gen_random_uuid(),
  placa           text unique not null,
  modelo          text not null,
  anio            int not null,
  color           text not null,
  tono            text,           -- blue | slate | rose | ink | sand | white
  segmento        text,           -- Sedán | SUV | Compacto | Pickup …
  transmision     text,           -- Aut. | Man.
  km              int not null default 0,
  combustible     int not null default 100 check (combustible between 0 and 100),
  status          text not null default 'disponible'
                    check (status in ('disponible','rentado','taller','reservado')),
  tarifa_diaria   numeric(10,2),
  cliente_actual  text,
  info_cliente    text,
  created_at      timestamptz not null default now()
);

-- ── Clientes ──────────────────────────────────────────
create table if not exists clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  apellido   text not null,
  email      text,
  telefono   text,
  licencia   text,
  created_at timestamptz not null default now()
);

-- ── Reservas ──────────────────────────────────────────
create table if not exists reservas (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null references clientes(id) on delete restrict,
  vehiculo_id      uuid not null references vehiculos(id) on delete restrict,
  empleado_id      uuid references empleados(id),
  fecha_entrega    date not null,
  fecha_devolucion date not null,
  hora_entrega     time,
  status           text not null default 'pendiente'
                     check (status in ('pendiente','confirmada','entregada','devuelta','cancelada')),
  dias             int not null generated always as
                     (fecha_devolucion - fecha_entrega) stored,
  tarifa_diaria    numeric(10,2) not null,
  seguro           numeric(10,2) not null default 0,
  deposito         numeric(10,2) not null default 0,
  descuento        numeric(10,2) not null default 0,
  total            numeric(10,2) generated always as
                     (tarifa_diaria * (fecha_devolucion - fecha_entrega) + seguro + deposito - descuento) stored,
  notas            text,
  created_at       timestamptz not null default now()
);

-- ── Movimientos de caja ───────────────────────────────
create table if not exists movimientos_caja (
  id           uuid primary key default gen_random_uuid(),
  empleado_id  uuid references empleados(id),
  reserva_id   uuid references reservas(id),
  tipo         text not null,   -- 'cobro_entrega' | 'devolucion_deposito' | 'gasto' | 'apertura' | 'cierre'
  monto        numeric(10,2) not null,
  metodo       text check (metodo in ('efectivo','tarjeta','transferencia','mixto')),
  descripcion  text,
  turno        text,
  created_at   timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────
-- Por ahora deshabilitado para desarrollo. Activar antes de producción.
alter table empleados        disable row level security;
alter table vehiculos        disable row level security;
alter table clientes         disable row level security;
alter table reservas         disable row level security;
alter table movimientos_caja disable row level security;

-- ══════════════════════════════════════════════════════
-- Datos de prueba (igual que sampleData.ts)
-- ══════════════════════════════════════════════════════

insert into vehiculos (placa, modelo, anio, color, tono, segmento, transmision, km, combustible, status, tarifa_diaria, cliente_actual, info_cliente) values
  ('ABC-123', 'Nissan Sentra',   2022, 'Azul',   'blue',  'Sedán',    'Aut.', 45200, 78,  'rentado',    850,  'M. Pérez', 'vence vie'),
  ('XYZ-908', 'Nissan Versa',    2023, 'Blanco',  'white', 'Sedán',    'Aut.', 12100, 100, 'disponible', 780,  null, null),
  ('JKL-441', 'Chevrolet Aveo',  2021, 'Gris',   'slate', 'Sedán',    'Man.', 78300, 40,  'rentado',    700,  'R. López', 'vence hoy'),
  ('MNP-772', 'Kia Rio',         2023, 'Rojo',   'rose',  'Compacto', 'Man.', 38400, 60,  'taller',     650,  null, 'Cambio de aceite'),
  ('QRS-115', 'VW Polo',         2022, 'Negro',  'ink',   'Hatchback','Man.', 22800, 90,  'disponible', 760,  null, null),
  ('TUV-309', 'Toyota Yaris',    2023, 'Blanco',  'white', 'Compacto', 'Aut.',  8900, 95,  'reservado',  700,  null, 'jue 23 · 10:00'),
  ('LMN-300', 'Honda CR-V',      2022, 'Arena',  'sand',  'SUV',      'Aut.', 31500, 85,  'disponible', 1350, null, null),
  ('DEF-556', 'Mazda 3',         2023, 'Azul',   'blue',  'Sedán',    'Aut.',  9200, 100, 'disponible', 920,  null, null),
  ('GHI-884', 'Toyota Hilux',    2021, 'Gris',   'slate', 'Pickup',   'Man.', 62400, 55,  'rentado',    1650, 'P. Soto', 'vence lun'),
  ('PQR-667', 'Nissan X-Trail',  2022, 'Blanco',  'white', 'SUV',      'Aut.', 27800, 70,  'reservado',  1280, null, 'sáb 25 · 09:00'),
  ('RST-887', 'Toyota Hilux',    2020, 'Blanco',  'white', 'Pickup',   'Man.', 94100, 50,  'disponible', 1650, null, null),
  ('DEF-220', 'Mazda CX-5',      2022, 'Azul',   'blue',  'SUV',      'Aut.', 33200, 80,  'rentado',    1400, 'C. Mendoza', 'vence jue'),
  ('GHI-554', 'Honda City',      2023, 'Gris',   'slate', 'Sedán',    'Aut.', 11400, 92,  'disponible', 880,  null, null),
  ('WXY-660', 'VW Tiguan',       2021, 'Negro',  'ink',   'SUV',      'Aut.', 47600, 65,  'rentado',    1520, 'A. Ruiz', 'vence sáb'),
  ('KLM-013', 'Nissan Kicks',    2023, 'Rojo',   'rose',  'SUV',      'Aut.', 14200, 88,  'disponible', 1280, null, null)
on conflict (placa) do nothing;
