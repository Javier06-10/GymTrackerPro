-- ============================================================
-- GymTracker Pro — esquema inicial (SaaS multi-entrenador)
-- Cada entrenador es un tenant: todas las tablas llevan trainer_id
-- y RLS restringe a trainer_id = auth.uid().
-- Suscripciones manuales: el admin activa/renueva planes.
-- ============================================================

-- ---------- PLANES ----------
create table public.planes (
  id            smallint generated always as identity primary key,
  codigo        text not null unique,
  nombre        text not null,
  precio_mensual numeric(10,2) not null default 0,
  max_atletas   int,                       -- null = ilimitado
  activo        boolean not null default true
);
insert into public.planes (codigo, nombre, precio_mensual, max_atletas) values
  ('prueba',  'Prueba gratis', 0,    10),
  ('basico',  'Básico',        9.99, 25),
  ('pro',     'Pro',           19.99, 100),
  ('elite',   'Élite',         34.99, null);

-- ---------- PERFILES (ENTRENADORES) ----------
create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null default '',
  negocio     text not null default '',
  telefono    text not null default '',
  logo_url    text,
  rol         text not null default 'entrenador' check (rol in ('entrenador','admin')),
  created_at  timestamptz not null default now()
);

-- ---------- SUSCRIPCIONES ----------
create table public.suscripciones (
  trainer_id  uuid primary key references public.perfiles(id) on delete cascade,
  plan_id     smallint not null references public.planes(id),
  estado      text not null default 'prueba' check (estado in ('prueba','activa','vencida','cancelada')),
  vence_el    date not null,
  updated_at  timestamptz not null default now()
);

create table public.pagos_suscripcion (
  id            uuid primary key default gen_random_uuid(),
  trainer_id    uuid not null references public.perfiles(id) on delete cascade,
  plan_id       smallint not null references public.planes(id),
  monto         numeric(10,2) not null check (monto >= 0),
  metodo        text not null default 'Transferencia',
  referencia    text not null default '',
  periodo_desde date not null,
  periodo_hasta date not null,
  registrado_por uuid references public.perfiles(id),
  created_at    timestamptz not null default now()
);
create index on public.pagos_suscripcion (trainer_id);

-- ---------- GRUPOS ----------
create table public.grupos (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  nombre      text not null,
  created_at  timestamptz not null default now()
);
create index on public.grupos (trainer_id);

-- ---------- ATLETAS ----------
-- rutina, asistencia y objetivos se guardan como jsonb (misma forma que la plantilla):
--   rutina:     {"Lunes":{"titulo":"","ejercicios":[{nombre,series,peso,descanso,notas,historialPeso:[{fecha,peso}]}]}, ...}
--   asistencia: {"2026-10-08":"E" | "F"}
--   objetivos:  [{id,titulo,tipo,zona?,unidad?,valorInicial,valorObjetivo,valorActual?,fecha}]
create table public.atletas (
  id                  uuid primary key default gen_random_uuid(),
  trainer_id          uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  grupo_id            uuid references public.grupos(id) on delete set null,
  nombre              text not null,
  telefono            text not null default '',
  genero              text not null default 'hombre' check (genero in ('hombre','mujer')),
  estatura_pies       smallint not null default 5,
  estatura_pulg       smallint not null default 8,
  composicion         text not null default 'musculo',
  objetivo            text not null default 'recomp' check (objetivo in ('perder','ganar','recomp','mantener')),
  objetivo_texto      text not null default '',
  fecha_nacimiento    date,
  edad                smallint,
  condiciones         text not null default '',
  horas_sueno         text not null default '',
  estilo_vida         text not null default '',
  activo              boolean not null default true,
  frecuencia_medicion smallint not null default 30,
  tarifa              numeric(10,2) not null default 0,
  proximo_pago        date,
  bitacora_foco       text not null default '',
  bitacora_metas      text not null default '',
  rutina              jsonb not null default '{}'::jsonb,
  asistencia          jsonb not null default '{}'::jsonb,
  objetivos           jsonb not null default '[]'::jsonb,
  fecha_registro      date not null default current_date,
  created_at          timestamptz not null default now()
);
create index on public.atletas (trainer_id);
create index on public.atletas (grupo_id);

-- ---------- MEDIDAS ----------
create table public.medidas (
  id              uuid primary key default gen_random_uuid(),
  trainer_id      uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  atleta_id       uuid not null references public.atletas(id) on delete cascade,
  fecha           date not null,
  peso            numeric(6,1) not null,
  pecho           numeric(5,1),
  brazo_relajado  numeric(5,1),
  brazo_contraido numeric(5,1),
  antebrazo       numeric(5,1),
  abdomen_alto    numeric(5,1),
  abdomen_ombligo numeric(5,1),
  cadera          numeric(5,1),
  pierna          numeric(5,1),
  pantorrilla     numeric(5,1),
  created_at      timestamptz not null default now()
);
create index on public.medidas (atleta_id, fecha);
create index on public.medidas (trainer_id);

-- ---------- PAGOS DE ATLETAS ----------
create table public.pagos (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  atleta_id   uuid not null references public.atletas(id) on delete cascade,
  fecha       date not null,
  monto       numeric(10,2) not null check (monto > 0),
  metodo      text not null default 'Efectivo',
  concepto    text not null default 'Mensualidad',
  created_at  timestamptz not null default now()
);
create index on public.pagos (atleta_id, fecha);
create index on public.pagos (trainer_id, fecha);

-- ---------- EJERCICIOS PERSONALIZADOS (se suman al catálogo base) ----------
create table public.ejercicios_extra (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  nombre      text not null,
  grupo       text not null default 'Otro',
  familia     text not null default '',
  musculos    text[] not null default '{}',
  created_at  timestamptz not null default now()
);
create index on public.ejercicios_extra (trainer_id);

-- ============================================================
-- FUNCIONES DE APOYO
-- ============================================================
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfiles where id = (select auth.uid()) and rol = 'admin');
$$;

-- La suscripción permite escribir si no está cancelada y no ha vencido.
create or replace function public.suscripcion_vigente()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.suscripciones
    where trainer_id = (select auth.uid())
      and estado in ('prueba','activa')
      and vence_el >= current_date
  );
$$;

-- Alta automática: perfil + 14 días de prueba al registrarse.
create or replace function public.al_crear_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre, negocio)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nombre', ''),
          coalesce(new.raw_user_meta_data->>'negocio', ''));
  insert into public.suscripciones (trainer_id, plan_id, estado, vence_el)
  values (new.id, (select id from public.planes where codigo = 'prueba'), 'prueba', current_date + 14);
  return new;
end;
$$;
create trigger trg_al_crear_usuario
  after insert on auth.users
  for each row execute function public.al_crear_usuario();

-- Límite de atletas según el plan.
create or replace function public.validar_limite_atletas()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_max int;
  v_total int;
begin
  select p.max_atletas into v_max
  from public.suscripciones s join public.planes p on p.id = s.plan_id
  where s.trainer_id = new.trainer_id;
  if v_max is not null then
    select count(*) into v_total from public.atletas where trainer_id = new.trainer_id;
    if v_total >= v_max then
      raise exception 'Tu plan permite hasta % atletas. Mejora tu plan para agregar más.', v_max
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_limite_atletas
  before insert on public.atletas
  for each row execute function public.validar_limite_atletas();

-- Registrar un pago de suscripción (solo admin): guarda el pago y extiende la vigencia.
create or replace function public.admin_registrar_pago_suscripcion(
  p_trainer_id uuid, p_plan_id smallint, p_meses int, p_monto numeric,
  p_metodo text default 'Transferencia', p_referencia text default '')
returns public.suscripciones language plpgsql security definer set search_path = '' as $$
declare
  v_desde date;
  v_hasta date;
  v_sus public.suscripciones;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede registrar pagos de suscripción';
  end if;
  if p_meses < 1 then raise exception 'Meses inválidos'; end if;

  select greatest(vence_el + 1, current_date) into v_desde
  from public.suscripciones where trainer_id = p_trainer_id;
  v_desde := coalesce(v_desde, current_date);
  v_hasta := (v_desde + make_interval(months => p_meses))::date - 1;

  insert into public.pagos_suscripcion
    (trainer_id, plan_id, monto, metodo, referencia, periodo_desde, periodo_hasta, registrado_por)
  values (p_trainer_id, p_plan_id, p_monto, p_metodo, p_referencia, v_desde, v_hasta, (select auth.uid()));

  update public.suscripciones
     set plan_id = p_plan_id, estado = 'activa', vence_el = v_hasta, updated_at = now()
   where trainer_id = p_trainer_id
  returning * into v_sus;
  return v_sus;
end;
$$;

-- ============================================================
-- PRIVILEGIOS Y RLS
-- ============================================================
alter table public.planes             enable row level security;
alter table public.perfiles           enable row level security;
alter table public.suscripciones      enable row level security;
alter table public.pagos_suscripcion  enable row level security;
alter table public.grupos             enable row level security;
alter table public.atletas            enable row level security;
alter table public.medidas            enable row level security;
alter table public.pagos              enable row level security;
alter table public.ejercicios_extra   enable row level security;

-- Planes: lectura pública para la página de precios.
create policy planes_lectura on public.planes for select using (true);

-- Perfiles: cada quien ve/edita el suyo; el admin ve todos.
-- El rol NO se puede cambiar desde el cliente (privilegio por columna).
create policy perfiles_lectura on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());
create policy perfiles_editar on public.perfiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.perfiles from authenticated, anon;
grant update (nombre, negocio, telefono, logo_url) on public.perfiles to authenticated;

-- Suscripciones: el entrenador solo lee la suya; el admin lee todas y cambia estado (vía RPC o update).
create policy suscripciones_lectura on public.suscripciones for select to authenticated
  using (trainer_id = (select auth.uid()) or public.es_admin());
create policy suscripciones_admin on public.suscripciones for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy pagos_sus_lectura on public.pagos_suscripcion for select to authenticated
  using (trainer_id = (select auth.uid()) or public.es_admin());

-- Tablas del entrenador: leer siempre lo propio; escribir solo con suscripción vigente.
do $$
declare t text;
begin
  foreach t in array array['grupos','atletas','medidas','pagos','ejercicios_extra'] loop
    execute format('create policy %1$s_lectura on public.%1$s for select to authenticated
                      using (trainer_id = (select auth.uid()))', t);
    execute format('create policy %1$s_insertar on public.%1$s for insert to authenticated
                      with check (trainer_id = (select auth.uid()) and public.suscripcion_vigente())', t);
    execute format('create policy %1$s_editar on public.%1$s for update to authenticated
                      using (trainer_id = (select auth.uid()))
                      with check (trainer_id = (select auth.uid()) and public.suscripcion_vigente())', t);
    execute format('create policy %1$s_borrar on public.%1$s for delete to authenticated
                      using (trainer_id = (select auth.uid()) and public.suscripcion_vigente())', t);
  end loop;
end $$;

-- Las medidas y pagos deben apuntar a un atleta del mismo entrenador.
create or replace function public.validar_atleta_propio()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.atletas where id = new.atleta_id and trainer_id = new.trainer_id) then
    raise exception 'Atleta no válido';
  end if;
  return new;
end;
$$;
create trigger trg_medidas_atleta before insert or update on public.medidas
  for each row execute function public.validar_atleta_propio();
create trigger trg_pagos_atleta before insert or update on public.pagos
  for each row execute function public.validar_atleta_propio();

-- grupo_id del atleta debe ser del mismo entrenador.
create or replace function public.validar_grupo_propio()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.grupo_id is not null and not exists
     (select 1 from public.grupos where id = new.grupo_id and trainer_id = new.trainer_id) then
    raise exception 'Grupo no válido';
  end if;
  return new;
end;
$$;
create trigger trg_atletas_grupo before insert or update on public.atletas
  for each row execute function public.validar_grupo_propio();

-- Funciones internas: no expuestas por la API.
revoke execute on function public.al_crear_usuario() from public, anon, authenticated;
revoke execute on function public.validar_limite_atletas() from public, anon, authenticated;
revoke execute on function public.validar_atleta_propio() from public, anon, authenticated;
revoke execute on function public.validar_grupo_propio() from public, anon, authenticated;
revoke execute on function public.admin_registrar_pago_suscripcion(uuid, smallint, int, numeric, text, text) from public, anon;
grant execute on function public.admin_registrar_pago_suscripcion(uuid, smallint, int, numeric, text, text) to authenticated;
