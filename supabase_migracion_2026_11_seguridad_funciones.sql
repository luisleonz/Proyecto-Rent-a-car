-- ═══════════════════════════════════════════════════════════════════
--  Ajustes de seguridad sugeridos por el asesor de Supabase
--  Ejecutar en Supabase → SQL Editor (Run as: postgres). Se puede ejecutar varias veces.
--  · Las funciones de los disparadores (tg_*) solo deben correr como disparadores, no
--    llamarse por la API: se les quita el permiso de ejecución (los disparadores siguen
--    funcionando igual).
--  · Funciones sin search_path fijo: se fija en "public".
--  Las funciones públicas a propósito (vehiculos_publicos, datos_publicos) y las de la app
--  para usuarios con sesión (es_empleado, asignar_rol, listar_empleados, sincronizar_*)
--  se quedan como están: cada una revisa el permiso por dentro.
-- ═══════════════════════════════════════════════════════════════════
do $$
declare f text;
begin
  foreach f in array array['tg_auditar', 'tg_reserva_sincroniza', 'tg_veto_aplicar', 'tg_inmutable', 'tg_quien', 'tg_cliente_flag'] loop
    if to_regproc('public.' || f) is not null then
      execute format('revoke execute on function public.%I() from public, anon, authenticated', f);
    end if;
  end loop;
  foreach f in array array['tg_inmutable', 'tg_quien', 'tg_cliente_flag', 'es_admin', 'es_dueno'] loop
    if to_regproc('public.' || f) is not null then
      execute format('alter function public.%I() set search_path = public', f);
    end if;
  end loop;
end $$;
