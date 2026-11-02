-- ═══════════════════════════════════════════════════════════════════
--  Clientes no deseados (no rentar)
--  Ejecutar en Supabase → SQL Editor (Run as: postgres), después de
--  supabase_migracion_2026_11_control.sql. Se puede ejecutar varias veces.
--
--  · clientes.no_rentar: marca rápida para avisar y bloquear reservas nuevas
--  · clientes_vetos: historial permanente de cada vez que se marca o se quita
--    la marca (quién, cuándo, por qué y en qué renta). Nadie lo edita ni borra.
--  · Cualquier usuario con acceso puede marcar; solo el Dueño puede quitar la marca.
-- ═══════════════════════════════════════════════════════════════════

alter table clientes add column if not exists no_rentar        boolean not null default false;
alter table clientes add column if not exists no_rentar_motivo text;
alter table clientes add column if not exists no_rentar_desde  timestamptz;
alter table clientes add column if not exists no_rentar_por    text;

-- No foreign keys on purpose: the history must survive even if a client or rental is deleted
create table if not exists clientes_vetos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null,
  cliente_nombre   text not null,
  cliente_telefono text,
  accion           text not null check (accion in ('marcar', 'quitar')),
  motivo           text not null check (length(trim(motivo)) > 0),
  reserva_id       uuid,
  reserva_folio    bigint,
  fecha            timestamptz not null default now(),
  registrado_por   text
);
create index if not exists clientes_vetos_cliente_idx on clientes_vetos(cliente_id, fecha desc);

-- The flag on the client only changes through this history (or the import script)
create or replace function public.tg_cliente_flag() returns trigger language plpgsql as $$
begin
  if (new.no_rentar is distinct from old.no_rentar or new.no_rentar_motivo is distinct from old.no_rentar_motivo)
     and coalesce(current_setting('app.vetos', true), '') <> 'si' then
    raise exception 'Para marcar o quitar un cliente no deseado usa el botón de la app (queda en el historial).';
  end if;
  return new;
end $$;
drop trigger if exists flag_no_rentar on clientes;
create trigger flag_no_rentar before update on clientes for each row execute function public.tg_cliente_flag();

create or replace function public.tg_veto_aplicar() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if new.accion = 'quitar' and not public.es_dueno() and auth.uid() is not null then
    raise exception 'Solo el dueño puede quitar a un cliente de la lista de no deseados.';
  end if;
  if auth.jwt() ->> 'email' is not null then new.registrado_por := auth.jwt() ->> 'email'; end if;
  perform set_config('app.vetos', 'si', true);
  update clientes set no_rentar = (new.accion = 'marcar'),
    no_rentar_motivo = case when new.accion = 'marcar' then new.motivo end,
    no_rentar_desde  = case when new.accion = 'marcar' then new.fecha end,
    no_rentar_por    = case when new.accion = 'marcar' then new.registrado_por end
  where id = new.cliente_id;
  perform set_config('app.vetos', '', true);
  insert into logs (accion, entidad, entidad_id, descripcion, realizado_por)
  values (case when new.accion = 'marcar' then 'cliente_no_deseado' else 'cliente_permitido' end, 'clientes', new.cliente_id::text,
          case when new.accion = 'marcar' then 'Marcó a ' else 'Quitó de no deseados a ' end || new.cliente_nombre
            || coalesce(' (renta #' || new.reserva_folio || ')', '') || ': ' || new.motivo, new.registrado_por);
  return new;
end $$;
drop trigger if exists aplicar on clientes_vetos;
create trigger aplicar before insert on clientes_vetos for each row execute function public.tg_veto_aplicar();

drop trigger if exists inmutable on clientes_vetos;
create trigger inmutable before update or delete on clientes_vetos for each row execute function public.tg_inmutable();
drop trigger if exists auditar on clientes_vetos;
create trigger auditar after insert on clientes_vetos for each row execute function public.tg_auditar();

alter table clientes_vetos enable row level security;
drop policy if exists empleados_leen on clientes_vetos;
drop policy if exists empleados_crean on clientes_vetos;
drop policy if exists empleados_editan on clientes_vetos;
drop policy if exists dueno_borra on clientes_vetos;
create policy empleados_leen on clientes_vetos for select to authenticated using (public.es_empleado());
create policy empleados_crean on clientes_vetos for insert to authenticated
  with check (public.es_empleado() and (accion = 'marcar' or public.es_dueno()));
