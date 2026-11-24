-- ============================================================
-- 0013 · "Marca oscuro" pasa a ser el tema predeterminado
-- Solo cambia el valor por defecto para los entrenadores NUEVOS.
-- Los perfiles existentes conservan su tema (el perfil manda sobre
-- el dispositivo en TemaService, así que sin esto el cambio del
-- cliente no llegaría a nadie que inicie sesión).
-- ============================================================
alter table public.perfiles alter column tema set default 'marca-oscuro';
