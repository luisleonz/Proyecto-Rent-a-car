#!/usr/bin/env python3
"""Genera un script SQL que importa el respaldo JSON del sistema anterior a Supabase.

Uso:  python3 scripts/importar_respaldo.py respaldo.json > importar.sql
      python3 scripts/importar_respaldo.py respaldo.json --limpio > cambio_limpio.sql
Luego se ejecuta el .sql en Supabase → SQL Editor (Run as: postgres).

Modo normal: fusiona todo el historial; volver a ejecutarlo actualiza en lugar de duplicar.
Modo --limpio (para el día del cambio de sistema): BORRA los datos de la app (reservas, pagos,
clientes, vehículos, cotizaciones, solicitudes y actividad) y carga solo vehículos, clientes y las
rentas activas y próximas, con sus pagos. Los números de contrato siguen después del último del
sistema anterior. Los usuarios y archivos (fotos, firma) no se tocan.
El archivo generado contiene datos personales de clientes: no lo suba al repositorio.
"""
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MIGRACIONES = ['supabase_migracion_2026_10_contratos.sql', 'supabase_migracion_2026_10_importacion.sql',
               'supabase_migracion_2026_10_operacion.sql', 'supabase_migracion_2026_11_control.sql',
               'supabase_migracion_2026_11_clientes.sql']
TZ = timedelta(hours=-7)  # America/Hermosillo, sin horario de verano

METODO = {'cash': 'efectivo', 'bank_transfer': 'transferencia', 'card': 'tarjeta', 'pos': 'tarjeta'}
STATUS_RES = {'completed': 'devuelta', 'active': 'entregada', 'reserved': 'confirmada', 'cancelled': 'cancelada'}
STATUS_VEH = {'available': 'disponible', 'rented': 'rentado', 'reserved': 'reservado', 'maintenance': 'taller'}
SEGMENTO = {'Sedan': 'Sedán', 'Van': 'Van', 'Minivan': 'Van', 'SUV': 'SUV', 'Pickup': 'Pickup', 'Hatchback': 'Hatchback'}
COLOR = {'White': ('Blanco', 'white'), 'Black': ('Negro', 'ink'), 'Gray': ('Gris', 'slate'), 'Grey': ('Gris', 'slate'),
         'Silver': ('Plata', 'slate'), 'Red': ('Rojo', 'rose'), 'Blue': ('Azul', 'blue')}


def q(v):
    if v is None or v == '':
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(round(v, 2)) if isinstance(v, float) else str(v)
    return "'" + str(v).replace("'", "''") + "'"


def local(ts):
    return datetime.fromisoformat(ts) + TZ if ts else None


def combustible(nivel):
    n = (nivel or '').strip().lower()
    return {'full': 100, '3/4': 75, '1/2': 50, 'half': 50, '1/4': 25, 'empty': 0}.get(n)


def nacionalidad(n):
    n = (n or '').strip()
    return 'Mexicana' if re.match(r'(?i)^mex', n) else (n or None)


def values(filas):
    return ',\n'.join('(' + ', '.join(q(x) for x in f) + ')' for f in filas)


def vigente(c, hoy):
    """Active rentals (car still out) and upcoming bookings whose dates haven't passed."""
    return c['status'] == 'active' or (c['status'] == 'reserved' and local(c['end_date']).date() >= hoy)


def main(ruta, limpio=False):
    d = json.load(open(ruta, encoding='utf-8'))
    hoy = (datetime.utcnow() + TZ).date()
    todos = [c for c in d['contracts'] if not c.get('is_deleted')]
    folio_max = max(int(c['contract_number']) for c in d['contracts'] if str(c['contract_number']).isdigit())
    contratos = [c for c in todos if vigente(c, hoy)] if limpio else todos
    ids_contrato = {c['id'] for c in contratos}
    con_contrato = {c['customer_id'] for c in contratos}

    veh = []
    for v in d['vehicles']:
        if v.get('is_deleted'):
            continue
        color, tono = COLOR.get(v.get('color') or '', (v.get('color') or None, 'sand'))
        foto = (v.get('images') or [None])[0] or v.get('primary_image_url')
        veh.append([v['id'], v['plate'].strip().upper(), f"{v.get('make') or ''} {v.get('model') or ''}".strip(), v.get('year'),
                    color, tono, SEGMENTO.get(v.get('vehicle_type') or ''),
                    {'automatic': 'Automático', 'manual': 'Manual'}.get(v.get('transmission') or ''),
                    v.get('mileage'), STATUS_VEH.get(v.get('status'), 'disponible'), v.get('price_per_day'),
                    v.get('vin'), v.get('seats'), v.get('deposit_amount') or 0, foto])

    cli = []
    for c in d['customers']:
        if c.get('is_deleted') and c['id'] not in con_contrato:
            continue
        tels = [t for t in (c.get('phones') or []) if t]
        notas = '\n'.join(x for x in [c.get('notes'), f"Otro teléfono: {', '.join(tels[1:])}" if len(tels) > 1 else None] if x)
        direccion = ', '.join(x.strip() for x in [c.get('address'), c.get('address_2')] if x and x.strip())
        cli.append([c['id'], (c.get('full_name') or '').strip(), tels[0] if tels else None, c.get('email'),
                    c.get('license_number'), c.get('license_expiry') or None, c.get('passport_number'), direccion,
                    c.get('date_of_birth') or None, nacionalidad(c.get('nationality')),
                    c.get('emergency_contact_name'), c.get('emergency_contact_phone'), notas, c.get('created_date')])

    fianza_metodo = {x['contract_id']: METODO.get(x.get('payment_method')) for x in d['deposits'] if not x.get('is_deleted')}

    # Bookings not yet activated keep their advance and deposit in "pending_*" fields, not in payments
    def declarado(c, campo):
        x = c.get(campo)
        return x if isinstance(x, dict) and x.get('declared') and x.get('amount') else None

    def anticipo(c):
        return None if c.get('initial_payment_recorded') else declarado(c, 'pending_initial_payment')

    res = []
    for c in contratos:
        ini, fin = local(c['start_date']), local(c['end_date'])
        dias = max(1, (fin.date() - ini.date()).days)
        total, iva = c.get('total_price'), c.get('tax_amount') or 0
        if c.get('discount_type') == 'flat':
            desc = c.get('discount_amount') or 0
        elif total is not None and c.get('price_per_day'):
            desc = max(0, c['price_per_day'] * dias - (total - iva))
        else:
            desc = 0
        notas = '\n'.join(x for x in [c.get('internal_notes'), c.get('notes'),
                                      f"Cancelación: {c.get('cancelled_reason') or c.get('cancellation_reason')}" if c.get('status') == 'cancelled' and (c.get('cancelled_reason') or c.get('cancellation_reason')) else None] if x)
        ant, gar = anticipo(c), declarado(c, 'pending_deposit_collected')
        res.append([c['id'], int(c['contract_number']), c['customer_id'], c['vehicle_id'],
                    ini.date().isoformat(), ini.strftime('%H:%M'), fin.date().isoformat(), fin.strftime('%H:%M'),
                    STATUS_RES.get(c['status'], 'confirmada'), total, (c.get('amount_paid') or 0) + (ant['amount'] if ant else 0),
                    METODO.get((ant or {}).get('method') or c.get('initial_payment_method')), round(desc, 2), iva,
                    (gar or {}).get('amount') or c.get('deposit_amount') or 0, fianza_metodo.get(c['id']) or METODO.get((gar or {}).get('method')),
                    c.get('pickup_location'), c.get('return_location'), notas or None,
                    c.get('mileage_on_pickup') or c.get('odometer_out'), c.get('mileage_on_return') or c.get('odometer_in'),
                    combustible(c.get('fuel_level_out') or c.get('fuel_level_on_pickup')),
                    combustible(c.get('fuel_level_in') or c.get('fuel_level_on_return')),
                    c.get('actual_return_date'), c.get('created_date')])

    pagos = [[p['id'], p['contract_id'], p['amount'], METODO.get(p.get('payment_method')), p.get('payment_date'),
              p.get('notes'), p.get('recorded_by'), 'renta']
             for p in d['contract_payments']
             if p.get('payment_status') == 'succeeded' and not p.get('is_deleted') and p['contract_id'] in ids_contrato]
    con_garantia = set()
    for x in d['deposits']:
        if x.get('is_deleted') or x['contract_id'] not in ids_contrato or not x.get('amount'):
            continue
        con_garantia.add(x['contract_id'])
        pagos.append([x['id'], x['contract_id'], x['amount'], METODO.get(x.get('payment_method')), x.get('created_date'), x.get('notes'), x.get('processed_by'), 'fianza'])
        if x.get('refund_amount'):
            pagos.append([x['id'] + ':devolucion', x['contract_id'], x['refund_amount'], METODO.get(x.get('payment_method')),
                          x.get('processed_date') or x.get('updated_date'), None, x.get('processed_by'), 'devolucion_fianza'])
    for c in contratos:
        ant, gar = anticipo(c), declarado(c, 'pending_deposit_collected')
        if ant:
            pagos.append([c['id'] + ':anticipo', c['id'], ant['amount'], METODO.get(ant.get('method')), ant.get('date'), 'Anticipo al reservar', None, 'renta'])
        if gar and c['id'] not in con_garantia:
            pagos.append([c['id'] + ':garantia', c['id'], gar['amount'], METODO.get(gar.get('method')), gar.get('date'), 'Garantía recibida al reservar', None, 'fianza'])

    titulo = 'CAMBIO LIMPIO: borra los datos actuales y carga solo rentas activas y próximas' if limpio else 'Importación del respaldo del sistema anterior'
    out = [f'-- {titulo} · generado {datetime.now():%Y-%m-%d %H:%M} (hoy en Sonora: {hoy})',
           f'-- {len(veh)} vehículos · {len(cli)} clientes · {len(res)} reservas · {len(pagos)} pagos',
           '-- CONTIENE DATOS PERSONALES DE CLIENTES. No compartir ni subir al repositorio.',
           'begin;', '']
    for m in MIGRACIONES:
        out += [f'-- ── {m} ──', (RAIZ / m).read_text(encoding='utf-8'), '']
    if limpio:
        out += [BORRAR]
    out += [CREAR_STAGING,
            'insert into _v values\n' + values(veh) + ';',
            'insert into _c values\n' + values(cli) + ';',
            'insert into _r values\n' + values(res) + ';',
            ('insert into _p values\n' + values(pagos) + ';') if pagos else '',
            FUSION,
            # Keep numbering after the last contract of the old system (even ones not imported)
            f"select setval(pg_get_serial_sequence('public.reservas', 'folio'), greatest({folio_max}, (select coalesce(max(folio), 0) from reservas)));",
            'select public.sincronizar_flota();',
            REAPLICAR_VETOS,
            ("alter table auditoria disable trigger user; delete from auditoria; alter table auditoria enable trigger user;\n"
             "insert into logs (accion, entidad, descripcion, realizado_por) values ('cambio_de_sistema', 'sistema', "
             f"'Inicio con datos del sistema anterior: {len(res)} rentas activas y próximas', 'importación');") if limpio else '',
            'commit;', '', RESUMEN]
    sys.stdout.write('\n'.join(out))


# Clients marked "no rentar" keep their mark after a re-import: the history is matched again
# to the (re-created) clients by phone or name, and the latest entry sets the flag.
REAPLICAR_VETOS = r"""
do $$ begin
  if to_regclass('public.clientes_vetos') is not null then
    execute 'alter table clientes_vetos disable trigger user';
    -- Same name first (relatives often share a phone), then same phone
    update clientes_vetos v set cliente_id = c.id
    from clientes c
    where not exists (select 1 from clientes x where x.id = v.cliente_id)
      and lower(trim(c.nombre)) = lower(trim(v.cliente_nombre));
    update clientes_vetos v set cliente_id = c.id
    from clientes c
    where not exists (select 1 from clientes x where x.id = v.cliente_id)
      and length(regexp_replace(coalesce(v.cliente_telefono, ''), '\D', '', 'g')) >= 10
      and right(regexp_replace(coalesce(c.telefono, ''), '\D', '', 'g'), 10) = right(regexp_replace(v.cliente_telefono, '\D', '', 'g'), 10);
    execute 'alter table clientes_vetos enable trigger user';
    perform set_config('app.vetos', 'si', true);
    update clientes c set no_rentar = (u.accion = 'marcar'),
      no_rentar_motivo = case when u.accion = 'marcar' then u.motivo end,
      no_rentar_desde  = case when u.accion = 'marcar' then u.fecha end,
      no_rentar_por    = case when u.accion = 'marcar' then u.registrado_por end
    from (select distinct on (cliente_id) * from clientes_vetos order by cliente_id, fecha desc) u
    where u.cliente_id = c.id;
    perform set_config('app.vetos', '', true);
  end if;
end $$;
"""

BORRAR = """
-- ── Borrar los datos actuales de la app (los usuarios y archivos no se tocan) ──
do $$ begin
  if to_regclass('public.movimientos_caja') is not null then execute 'delete from movimientos_caja'; end if;
  if to_regclass('public.solicitudes') is not null then execute 'delete from solicitudes'; end if;
  -- The activity log is permanent for app users; the cutover starts it fresh
  if to_regclass('public.logs') is not null then
    execute 'alter table logs disable trigger user'; execute 'delete from logs'; execute 'alter table logs enable trigger user';
  end if;
  if to_regclass('public.caja_movimientos') is not null then
    execute 'alter table caja_movimientos disable trigger user'; execute 'delete from caja_movimientos'; execute 'alter table caja_movimientos enable trigger user';
  end if;
end $$;
delete from pagos;
delete from cotizaciones;
delete from reservas;
delete from clientes;
delete from vehiculos;
"""

CREAR_STAGING = """
create temp table _v (legacy_id text, placa text, modelo text, anio int, color text, tono text, segmento text, transmision text,
  km int, status text, tarifa_diaria numeric, vin text, asientos int, fianza numeric, foto_url text) on commit drop;
create temp table _c (legacy_id text, nombre text, telefono text, email text, licencia text, licencia_vence date, identificacion text,
  direccion text, fecha_nacimiento date, nacionalidad text, contacto_emergencia text, contacto_emergencia_tel text, notas text,
  created_at timestamptz) on commit drop;
create temp table _r (legacy_id text, folio bigint, cliente_legacy text, vehiculo_legacy text, fecha_entrega date, hora_entrega time,
  fecha_devolucion date, hora_devolucion time, status text, total numeric, deposito numeric, metodo_deposito text, descuento numeric,
  iva numeric, fianza numeric, metodo_fianza text, lugar_entrega text, lugar_devolucion text, notas text, km_salida int, km_regreso int,
  combustible_salida int, combustible_regreso int, devuelto_at timestamptz, created_at timestamptz) on commit drop;
create temp table _p (legacy_id text, reserva_legacy text, monto numeric, metodo text, fecha timestamptz, notas text,
  registrado_por text, concepto text) on commit drop;

create or replace function pg_temp.nnom(t text) returns text language sql immutable as
  $f$ select upper(trim(regexp_replace(translate(coalesce(t, ''), 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouAEIOUNNUU'), '\\s+', ' ', 'g'))) $f$;
create or replace function pg_temp.ntel(t text) returns text language sql immutable as
  $f$ select case when length(regexp_replace(coalesce(t, ''), '\\D', '', 'g')) >= 10
                  then right(regexp_replace(t, '\\D', '', 'g'), 10) end $f$;
create or replace function pg_temp.nplaca(t text) returns text language sql immutable as
  $f$ select upper(regexp_replace(coalesce(t, ''), '[^A-Za-z0-9]', '', 'g')) $f$;
"""

FUSION = """
-- ── Vehículos: enlazar por placa, crear los que falten y actualizar con el respaldo ──
update vehiculos v set legacy_id = s.legacy_id
from _v s
where v.legacy_id is null and pg_temp.nplaca(v.placa) = pg_temp.nplaca(s.placa)
  and not exists (select 1 from vehiculos x where x.legacy_id = s.legacy_id);

insert into vehiculos (placa, modelo, anio, color, tono, segmento, transmision, km, combustible, status, tarifa_diaria, legacy_id)
select s.placa, s.modelo, s.anio, s.color, s.tono, s.segmento, s.transmision, coalesce(s.km, 0), 100, s.status, s.tarifa_diaria, s.legacy_id
from _v s where not exists (select 1 from vehiculos v where v.legacy_id = s.legacy_id);

update vehiculos v set
  modelo = s.modelo, anio = coalesce(s.anio, v.anio), color = coalesce(s.color, v.color), tono = coalesce(v.tono, s.tono),
  segmento = coalesce(s.segmento, v.segmento), transmision = coalesce(s.transmision, v.transmision),
  km = coalesce(s.km, v.km), status = s.status, tarifa_diaria = coalesce(s.tarifa_diaria, v.tarifa_diaria),
  vin = coalesce(s.vin, v.vin), asientos = coalesce(s.asientos, v.asientos), fianza = s.fianza,
  foto_url = coalesce(s.foto_url, v.foto_url)
from _v s where v.legacy_id = s.legacy_id;

-- ── Clientes: enlazar por nombre (uno a uno), crear los que falten y completar datos ──
create temp table _cm on commit drop as
select legacy_id, cliente_id from (
  select s.legacy_id, c.id as cliente_id,
    row_number() over (partition by s.legacy_id order by (pg_temp.ntel(c.telefono) is not distinct from pg_temp.ntel(s.telefono)) desc, c.created_at) as rn_s,
    row_number() over (partition by c.id order by (pg_temp.ntel(c.telefono) is not distinct from pg_temp.ntel(s.telefono)) desc, s.created_at) as rn_c
  from _c s
  join clientes c on c.legacy_id is null and pg_temp.nnom(c.nombre) = pg_temp.nnom(s.nombre)
  where not exists (select 1 from clientes x where x.legacy_id = s.legacy_id)
) m where rn_s = 1 and rn_c = 1;

update clientes c set legacy_id = m.legacy_id from _cm m where c.id = m.cliente_id;

insert into clientes (nombre, telefono, legacy_id, created_at)
select s.nombre, s.telefono, s.legacy_id, coalesce(s.created_at, now())
from _c s where not exists (select 1 from clientes c where c.legacy_id = s.legacy_id);

update clientes c set
  nombre = s.nombre, telefono = coalesce(s.telefono, c.telefono), email = coalesce(s.email, c.email),
  licencia = coalesce(s.licencia, c.licencia), licencia_vence = coalesce(s.licencia_vence, c.licencia_vence),
  identificacion = coalesce(s.identificacion, c.identificacion), direccion = coalesce(nullif(s.direccion, ''), c.direccion),
  fecha_nacimiento = coalesce(s.fecha_nacimiento, c.fecha_nacimiento), nacionalidad = coalesce(s.nacionalidad, c.nacionalidad),
  contacto_emergencia = coalesce(s.contacto_emergencia, c.contacto_emergencia),
  contacto_emergencia_tel = coalesce(s.contacto_emergencia_tel, c.contacto_emergencia_tel),
  notas = coalesce(nullif(s.notas, ''), c.notas)
from _c s where c.legacy_id = s.legacy_id;

-- ── Reservas ──
alter table _r add column cliente_id uuid, add column vehiculo_id uuid;
update _r s set cliente_id = c.id from clientes c where c.legacy_id = s.cliente_legacy;
update _r s set vehiculo_id = v.id from vehiculos v where v.legacy_id = s.vehiculo_legacy;

-- Reservas capturadas en esta app que son la misma renta del sistema anterior (mismo vehículo y fechas)
create temp table _rm on commit drop as
select legacy_id, reserva_id from (
  select s.legacy_id, r.id as reserva_id,
    row_number() over (partition by s.legacy_id order by r.created_at) as rn_s,
    row_number() over (partition by r.id order by s.created_at) as rn_r
  from _r s
  join reservas r on r.legacy_id is null and r.vehiculo_id = s.vehiculo_id
    and r.fecha_entrega = s.fecha_entrega and r.fecha_devolucion = s.fecha_devolucion and r.status <> 'cancelada'
  where s.status <> 'cancelada' and not exists (select 1 from reservas x where x.legacy_id = s.legacy_id)
) m where rn_s = 1 and rn_r = 1;

-- Los números de contrato del sistema anterior se conservan; las reservas creadas aquí se numeran después
update reservas set folio = -folio where legacy_id is null and folio > 0;
update reservas r set legacy_id = m.legacy_id from _rm m where r.id = m.reserva_id;

insert into reservas (folio, cliente_id, vehiculo_id, fecha_entrega, fecha_devolucion, status, total, deposito, legacy_id, created_at)
select s.folio, s.cliente_id, s.vehiculo_id, s.fecha_entrega, s.fecha_devolucion, s.status, s.total, s.deposito, s.legacy_id,
       coalesce(s.created_at, now())
from _r s where not exists (select 1 from reservas r where r.legacy_id = s.legacy_id);

update reservas r set
  folio = s.folio, cliente_id = s.cliente_id, vehiculo_id = s.vehiculo_id,
  fecha_entrega = s.fecha_entrega, hora_entrega = s.hora_entrega,
  fecha_devolucion = s.fecha_devolucion, hora_devolucion = s.hora_devolucion,
  status = s.status, total = s.total, deposito = s.deposito, metodo_deposito = s.metodo_deposito,
  descuento = s.descuento, iva = s.iva, fianza = s.fianza, metodo_fianza = s.metodo_fianza,
  lugar_entrega = coalesce(s.lugar_entrega, r.lugar_entrega), lugar_devolucion = coalesce(s.lugar_devolucion, r.lugar_devolucion),
  notas = coalesce(s.notas, r.notas), km_salida = s.km_salida, km_regreso = s.km_regreso,
  combustible_salida = s.combustible_salida, combustible_regreso = s.combustible_regreso, devuelto_at = s.devuelto_at
from _r s where r.legacy_id = s.legacy_id;

with nuevos as (
  select id, row_number() over (order by created_at, id) as rn from reservas where folio is null or folio < 0
)
update reservas r set folio = (select coalesce(max(folio), 0) from reservas where folio > 0) + n.rn
from nuevos n where r.id = n.id;

select setval(pg_get_serial_sequence('public.reservas', 'folio'), (select max(folio) from reservas));

-- ── Pagos ──
insert into pagos (reserva_id, monto, metodo, concepto, fecha, notas, registrado_por, legacy_id)
select r.id, p.monto, p.metodo, coalesce(p.concepto, 'renta'), coalesce(p.fecha, now()), p.notas, p.registrado_por, p.legacy_id
from _p p join reservas r on r.legacy_id = p.reserva_legacy
where not exists (select 1 from pagos x where x.legacy_id = p.legacy_id);

-- ── Cliente actual de cada vehículo importado ──
update vehiculos v set cliente_actual = x.nombre
from (
  select distinct on (r.vehiculo_id) r.vehiculo_id, c.nombre
  from reservas r join clientes c on c.id = r.cliente_id
  where r.status in ('entregada', 'confirmada')
  order by r.vehiculo_id, (r.status = 'entregada') desc, r.fecha_entrega
) x
where v.id = x.vehiculo_id and v.legacy_id is not null and v.status in ('rentado', 'reservado');
update vehiculos set cliente_actual = null where legacy_id is not null and status = 'disponible';
"""

RESUMEN = """-- Resultado de la importación
select
  (select count(*) from vehiculos where legacy_id is not null) as vehiculos_importados,
  (select count(*) from clientes  where legacy_id is not null) as clientes_importados,
  (select count(*) from reservas  where legacy_id is not null) as reservas_importadas,
  (select count(*) from pagos     where legacy_id is not null) as pagos_importados,
  (select count(*) from reservas  where legacy_id is null)     as reservas_de_esta_app,
  (select count(*) from vehiculos where legacy_id is null)     as vehiculos_no_del_respaldo,
  (select count(*) from reservas where status = 'entregada')   as rentas_activas,
  (select count(*) from reservas where status in ('confirmada', 'pendiente')) as rentas_proximas,
  (select coalesce(sum(greatest(total - deposito, 0)), 0) from reservas where status <> 'cancelada') as saldo_por_cobrar,
  (select last_value + 1 from pg_sequences where schemaname = 'public' and sequencename like 'reservas_folio%') as siguiente_contrato;
"""

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        sys.exit(__doc__)
    main(args[0], limpio='--limpio' in sys.argv)
