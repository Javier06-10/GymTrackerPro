-- ============================================================
-- 0015 · Recordatorios por correo al ENTRENADOR (no a los atletas)
--
-- Una vez al día la función `recordatorios` (Edge) pide aquí la lista
-- de correos a enviar y los manda por Resend. Reglas, iguales a las
-- del panel de la app:
--   · Cobro vencido: atleta activo con próximo pago ya pasado.
--   · Medición pendiente: atleta activo cuya última medida tiene
--     tantos días o más que su frecuencia (30 por defecto).
--   · Cumpleaños: en los próximos 7 días.
--   · Plan: vence en 3 días, en 1, hoy, o venció ayer.
--
-- Para no ser spam: como mucho UN correo al día, y solo si hoy pasó
-- algo nuevo (un cobro que vence hoy, una medición que toca hoy, un
-- cumpleaños hoy, un aviso del plan) o es lunes (resumen semanal).
-- Fecha de referencia: hora de República Dominicana.
-- ============================================================

-- Preferencia del entrenador (Mi cuenta → Recordatorios por correo)
alter table public.perfiles add column if not exists recordatorios boolean not null default true;
grant update (recordatorios) on public.perfiles to authenticated;

-- Registro de envíos: evita mandar dos veces el mismo día aunque el
-- programador repita la llamada.
create table if not exists public.recordatorios_envios (
  trainer_id  uuid not null references public.perfiles(id) on delete cascade,
  fecha       date not null,
  resend_id   text,
  error       text,
  creado_el   timestamptz not null default now(),
  primary key (trainer_id, fecha)
);
alter table public.recordatorios_envios enable row level security;
-- Sin políticas: solo la usa la función del servidor (service_role).
revoke all on public.recordatorios_envios from anon, authenticated;
grant select, insert, update on public.recordatorios_envios to service_role;

-- Próximo cumpleaños desde p_hoy (incluido). Igual que la app: el 29 de
-- febrero cae el 1 de marzo en años no bisiestos.
create or replace function public.proximo_cumple(p_nac date, p_hoy date)
returns date language plpgsql immutable set search_path = '' as $$
declare
  v_anio int := extract(year from p_hoy)::int;
  v_mes  int := extract(month from p_nac)::int;
  v_dia  int := extract(day from p_nac)::int;
  v_f    date;
begin
  for k in 0..1 loop
    begin
      v_f := make_date(v_anio + k, v_mes, v_dia);
    exception when others then
      v_f := make_date(v_anio + k, 3, 1);   -- 29-feb en año no bisiesto
    end;
    if v_f >= p_hoy then return v_f; end if;
  end loop;
  return v_f;
end;
$$;

-- Datos del correo de cada entrenador para el día `p_hoy`.
-- p_solo: limita a un entrenador (pruebas). p_forzar: ignora la regla
-- de "solo si pasó algo" y el registro de envíos (pruebas).
create or replace function public.recordatorios_del_dia(
  p_hoy date default (now() at time zone 'America/Santo_Domingo')::date,
  p_solo uuid default null,
  p_forzar boolean default false
)
returns table (
  trainer_id uuid, email text, nombre text, negocio text,
  semanal boolean, plan jsonb, vencidos jsonb, mediciones jsonb, cumples jsonb
)
language sql stable security definer set search_path = '' as $$
  with entrenadores as (
    select p.id, u.email, p.nombre, p.negocio, s.vence_el, s.estado, pl.nombre as plan_nombre
    from public.perfiles p
    join auth.users u on u.id = p.id and u.email_confirmed_at is not null and coalesce(u.email, '') <> ''
    join public.suscripciones s on s.trainer_id = p.id
    join public.planes pl on pl.id = s.plan_id
    where p.recordatorios
      and (p_solo is null or p.id = p_solo)
      and s.estado <> 'cancelada'
  ),
  ultima_medida as (
    select atleta_id, max(fecha) as fecha from public.medidas group by atleta_id
  ),
  por_entrenador as (
    select
      e.*,
      (select coalesce(jsonb_agg(jsonb_build_object('nombre', a.nombre, 'desde', a.proximo_pago,
                'dias', p_hoy - a.proximo_pago, 'tarifa', a.tarifa) order by a.proximo_pago), '[]'::jsonb)
         from public.atletas a
        where a.trainer_id = e.id and a.activo and a.proximo_pago < p_hoy) as vencidos,
      (select count(*) from public.atletas a
        where a.trainer_id = e.id and a.activo and a.proximo_pago = p_hoy - 1) as vencen_hoy,
      (select coalesce(jsonb_agg(jsonb_build_object('nombre', a.nombre, 'ultima', um.fecha,
                'dias', p_hoy - um.fecha) order by um.fecha), '[]'::jsonb)
         from public.atletas a join ultima_medida um on um.atleta_id = a.id
        where a.trainer_id = e.id and a.activo
          and p_hoy - um.fecha >= coalesce(nullif(a.frecuencia_medicion, 0), 30)) as mediciones,
      (select count(*) from public.atletas a join ultima_medida um on um.atleta_id = a.id
        where a.trainer_id = e.id and a.activo
          and p_hoy - um.fecha = coalesce(nullif(a.frecuencia_medicion, 0), 30)) as miden_hoy,
      (select coalesce(jsonb_agg(c order by (c->>'dias')::int), '[]'::jsonb) from (
         select jsonb_build_object('nombre', a.nombre, 'dias', pc.cumple - p_hoy,
                  'edad', extract(year from pc.cumple)::int - extract(year from a.fecha_nacimiento)::int) as c
           from public.atletas a
           cross join lateral (select public.proximo_cumple(a.fecha_nacimiento, p_hoy) as cumple) pc
          where a.trainer_id = e.id and a.fecha_nacimiento is not null
       ) x where (x.c->>'dias')::int between 0 and 7) as cumples,
      e.vence_el - p_hoy as dias_plan
    from entrenadores e
  )
  select
    pe.id, pe.email, pe.nombre, pe.negocio,
    extract(isodow from p_hoy) = 1 as semanal,
    case when pe.dias_plan in (3, 1, 0, -1)
         then jsonb_build_object('dias', pe.dias_plan, 'vence_el', pe.vence_el, 'plan', pe.plan_nombre, 'estado', pe.estado)
    end as plan,
    pe.vencidos, pe.mediciones, pe.cumples
  from por_entrenador pe
  where (p_forzar or not exists (
          select 1 from public.recordatorios_envios r where r.trainer_id = pe.id and r.fecha = p_hoy))
    and (p_forzar
         or pe.dias_plan in (3, 1, 0, -1)
         or pe.vencen_hoy > 0
         or pe.miden_hoy > 0
         or exists (select 1 from jsonb_array_elements(pe.cumples) c where (c->>'dias')::int = 0)
         or (extract(isodow from p_hoy) = 1
             and (jsonb_array_length(pe.vencidos) > 0 or jsonb_array_length(pe.mediciones) > 0 or jsonb_array_length(pe.cumples) > 0)));
$$;

revoke execute on function public.recordatorios_del_dia(date, uuid, boolean) from public, anon, authenticated;
grant execute on function public.recordatorios_del_dia(date, uuid, boolean) to service_role;
revoke execute on function public.proximo_cumple(date, date) from public, anon;
grant execute on function public.proximo_cumple(date, date) to service_role, authenticated;
