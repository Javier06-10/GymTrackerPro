-- Importa el respaldo JSON de la plantilla vieja (gymtracker_pro_5.html) en UNA transacción.
-- El cliente ya normalizó los datos; esta función solo inserta.
-- SECURITY INVOKER: aplican RLS (suscripción vigente), el límite de atletas del plan y los triggers.
create or replace function public.importar_respaldo(p_grupos jsonb, p_atletas jsonb, p_ejercicios jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  g jsonb;
  a jsonb;
  e jsonb;
  v_map jsonb := '{}'::jsonb;
  v_gid uuid;
  v_aid uuid;
  v_n int;
  n_atletas int := 0;
  n_medidas int := 0;
  n_pagos int := 0;
  n_ejercicios int := 0;
begin
  -- Grupos: reutiliza los que ya existen con el mismo nombre
  for g in select * from jsonb_array_elements(coalesce(p_grupos, '[]'::jsonb)) loop
    select id into v_gid from public.grupos
     where trainer_id = (select auth.uid()) and lower(nombre) = lower(g->>'nombre') limit 1;
    if v_gid is null then
      insert into public.grupos (nombre) values (g->>'nombre') returning id into v_gid;
    end if;
    v_map := v_map || jsonb_build_object(g->>'idViejo', v_gid);
  end loop;

  for a in select * from jsonb_array_elements(coalesce(p_atletas, '[]'::jsonb)) loop
    insert into public.atletas (
      grupo_id, nombre, telefono, genero, estatura_pies, estatura_pulg, composicion, objetivo, objetivo_texto,
      fecha_nacimiento, edad, condiciones, horas_sueno, estilo_vida, activo, frecuencia_medicion, tarifa,
      proximo_pago, bitacora_foco, bitacora_metas, rutina, asistencia, objetivos, fecha_registro)
    values (
      nullif(v_map->>(a->>'grupoViejo'), '')::uuid,
      a->>'nombre', a->>'telefono', a->>'genero',
      (a->>'estaturaPies')::smallint, (a->>'estaturaPulg')::smallint,
      a->>'composicion', a->>'objetivo', a->>'objetivoTexto',
      nullif(a->>'fechaNacimiento', '')::date, (a->>'edad')::smallint,
      a->>'condiciones', a->>'horasSueno', a->>'estiloVida',
      (a->>'activo')::boolean, (a->>'frecuenciaMedicion')::smallint, (a->>'tarifa')::numeric,
      nullif(a->>'proximoPago', '')::date, a->>'bitacoraFoco', a->>'bitacoraMetas',
      a->'rutina', a->'asistencia', a->'objetivos',
      coalesce(nullif(a->>'fechaRegistro', '')::date, current_date))
    returning id into v_aid;
    n_atletas := n_atletas + 1;

    insert into public.medidas (atleta_id, fecha, peso, pecho, brazo_relajado, brazo_contraido, antebrazo,
                                abdomen_alto, abdomen_ombligo, cadera, pierna, pantorrilla)
    select v_aid, (m->>'fecha')::date, (m->>'peso')::numeric,
           (m->>'pecho')::numeric, (m->>'brazoRelajado')::numeric, (m->>'brazoContraido')::numeric,
           (m->>'antebrazo')::numeric, (m->>'abdomenAlto')::numeric, (m->>'abdomenOmbligo')::numeric,
           (m->>'cadera')::numeric, (m->>'pierna')::numeric, (m->>'pantorrilla')::numeric
      from jsonb_array_elements(coalesce(a->'medidas', '[]'::jsonb)) m;
    get diagnostics v_n = row_count;
    n_medidas := n_medidas + v_n;

    insert into public.pagos (atleta_id, fecha, monto, metodo, concepto)
    select v_aid, (p->>'fecha')::date, (p->>'monto')::numeric, p->>'metodo', p->>'concepto'
      from jsonb_array_elements(coalesce(a->'pagos', '[]'::jsonb)) p;
    get diagnostics v_n = row_count;
    n_pagos := n_pagos + v_n;
  end loop;

  -- Ejercicios personalizados que aún no estén en el catálogo del entrenador
  for e in select * from jsonb_array_elements(coalesce(p_ejercicios, '[]'::jsonb)) loop
    if not exists (select 1 from public.ejercicios_extra
                    where trainer_id = (select auth.uid()) and lower(nombre) = lower(e->>'nombre')) then
      insert into public.ejercicios_extra (nombre, grupo, familia, musculos)
      values (e->>'nombre', e->>'grupo', e->>'familia',
              coalesce(array(select jsonb_array_elements_text(e->'musculos')), '{}'));
      n_ejercicios := n_ejercicios + 1;
    end if;
  end loop;

  return jsonb_build_object('atletas', n_atletas, 'medidas', n_medidas, 'pagos', n_pagos,
                            'grupos', jsonb_array_length(coalesce(p_grupos, '[]'::jsonb)), 'ejercicios', n_ejercicios);
end;
$$;
revoke execute on function public.importar_respaldo(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.importar_respaldo(jsonb, jsonb, jsonb) to authenticated;
