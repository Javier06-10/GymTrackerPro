-- ============================================================
-- 0009 · Compartir rutinas entre entrenadores
-- El que envía escribe el correo del otro entrenador; el que recibe
-- la ve en "Rutinas recibidas" y la aplica a sus atletas o la descarta.
-- ============================================================

create table public.rutinas_compartidas (
  id              uuid primary key default gen_random_uuid(),
  de_trainer_id   uuid not null references public.perfiles(id) on delete cascade,
  para_trainer_id uuid not null references public.perfiles(id) on delete cascade,
  -- Copia de los nombres al enviar (cada entrenador solo puede leer su propio perfil)
  de_nombre       text not null default '',
  de_negocio      text not null default '',
  para_email      text not null default '',
  para_nombre     text not null default '',
  nombre          text not null,
  nota            text not null default '',
  -- Solo los días compartidos: { "Lunes": { titulo, ejercicios: [...] }, ... }
  rutina          jsonb not null,
  estado          text not null default 'pendiente' check (estado in ('pendiente', 'aplicada', 'descartada')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (de_trainer_id <> para_trainer_id),
  check (jsonb_typeof(rutina) = 'object')
);
create index on public.rutinas_compartidas (para_trainer_id, estado);
create index on public.rutinas_compartidas (de_trainer_id);

alter table public.rutinas_compartidas enable row level security;

-- Solo las ven quien envía y quien recibe
create policy rutinas_comp_lectura on public.rutinas_compartidas for select to authenticated
  using (de_trainer_id = (select auth.uid()) or para_trainer_id = (select auth.uid()));
-- Quien recibe cambia el estado (aplicada / descartada)
create policy rutinas_comp_estado on public.rutinas_compartidas for update to authenticated
  using (para_trainer_id = (select auth.uid())) with check (para_trainer_id = (select auth.uid()));
-- Cualquiera de los dos la puede borrar de su lista
create policy rutinas_comp_borrar on public.rutinas_compartidas for delete to authenticated
  using (de_trainer_id = (select auth.uid()) or para_trainer_id = (select auth.uid()));

revoke all on public.rutinas_compartidas from anon, authenticated;
grant select, delete on public.rutinas_compartidas to authenticated;
grant update (estado, updated_at) on public.rutinas_compartidas to authenticated;
-- El alta es solo por la función enviar_rutina (valida destinatario, suscripción y tamaño)

create or replace function public.enviar_rutina(p_email text, p_nombre text, p_nota text, p_rutina jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_yo   public.perfiles;
  v_para public.perfiles;
  v_hoy  int;
begin
  select * into v_yo from public.perfiles where id = (select auth.uid());
  if v_yo.id is null then raise exception 'Inicia sesión para compartir rutinas' using errcode = '42501'; end if;
  if not public.suscripcion_vigente() then
    raise exception 'Tu suscripción no está vigente. Renueva tu plan para compartir rutinas.' using errcode = '42501';
  end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'Ponle nombre a la rutina'; end if;
  if p_rutina is null or jsonb_typeof(p_rutina) <> 'object' or p_rutina = '{}'::jsonb then
    raise exception 'La rutina no tiene días para compartir';
  end if;
  if pg_column_size(p_rutina) > 200000 then raise exception 'La rutina es demasiado grande para compartir'; end if;

  select * into v_para from public.perfiles where lower(email) = lower(trim(p_email)) limit 1;
  if v_para.id is null then raise exception 'No hay ningún entrenador registrado con ese correo'; end if;
  if v_para.id = v_yo.id then raise exception 'Ese es tu propio correo: usa "A mis atletas" para copiarla'; end if;

  select count(*) into v_hoy from public.rutinas_compartidas
   where de_trainer_id = v_yo.id and created_at > now() - interval '1 day';
  if v_hoy >= 50 then raise exception 'Llegaste al límite de 50 rutinas compartidas por día'; end if;

  insert into public.rutinas_compartidas
    (de_trainer_id, para_trainer_id, de_nombre, de_negocio, para_email, para_nombre, nombre, nota, rutina)
  values
    (v_yo.id, v_para.id, v_yo.nombre, v_yo.negocio, v_para.email, v_para.nombre,
     left(trim(p_nombre), 120), left(coalesce(trim(p_nota), ''), 500), p_rutina);

  return coalesce(nullif(v_para.nombre, ''), v_para.email);
end;
$$;

revoke execute on function public.enviar_rutina(text, text, text, jsonb) from public, anon;
grant execute on function public.enviar_rutina(text, text, text, jsonb) to authenticated;
