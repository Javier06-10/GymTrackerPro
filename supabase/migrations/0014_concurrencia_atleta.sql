-- ============================================================
-- 0014 · Que dos dispositivos no se pisen los cambios del atleta
--
-- rutina, asistencia y objetivos son jsonb enteros dentro de
-- `atletas`. El cliente mandaba el bloque completo: si el entrenador
-- editaba en el móvil y en el ordenador a la vez, el último en
-- guardar borraba en silencio lo del otro.
--
-- 1. Asistencia: se marca día por día con una función atómica
--    (fusiona en el servidor; nunca se reescribe el bloque).
-- 2. Rutina y objetivos: llevan un número de versión. El cliente
--    guarda solo si la versión no cambió; si cambió, recarga y avisa.
--    El trigger sube la versión en CUALQUIER cambio, incluso los que
--    hagan clientes viejos (PWA en caché) sin conocerla.
-- ============================================================

alter table public.atletas
  add column if not exists rutina_rev    integer not null default 0,
  add column if not exists objetivos_rev integer not null default 0;

create or replace function public.atletas_subir_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.rutina is distinct from old.rutina then
    new.rutina_rev := old.rutina_rev + 1;
  end if;
  if new.objetivos is distinct from old.objetivos then
    new.objetivos_rev := old.objetivos_rev + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_atletas_revision on public.atletas;
create trigger trg_atletas_revision
  before update of rutina, objetivos on public.atletas
  for each row execute function public.atletas_subir_revision();

-- Marca (E = entrenó, F = faltó) o borra (p_estado null) un día de asistencia.
-- SECURITY INVOKER: aplica la RLS de `atletas` (solo lo propio y con
-- suscripción vigente). Devuelve la asistencia completa ya fusionada.
create or replace function public.marcar_asistencia(p_atleta uuid, p_fecha text, p_estado text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_asistencia jsonb;
begin
  if p_fecha !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Fecha inválida: %', p_fecha using errcode = '22007';
  end if;
  if p_estado is not null and p_estado not in ('E', 'F') then
    raise exception 'Estado de asistencia inválido: %', p_estado using errcode = '22023';
  end if;

  update public.atletas
     set asistencia = case when p_estado is null then asistencia - p_fecha
                           else asistencia || jsonb_build_object(p_fecha, p_estado) end
   where id = p_atleta
  returning asistencia into v_asistencia;

  if not found then
    raise exception 'El atleta no existe o no es tuyo' using errcode = 'P0002';
  end if;
  return v_asistencia;
end;
$$;

revoke execute on function public.marcar_asistencia(uuid, text, text) from public, anon;
grant execute on function public.marcar_asistencia(uuid, text, text) to authenticated;
