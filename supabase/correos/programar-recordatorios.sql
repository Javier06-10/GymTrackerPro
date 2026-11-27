-- ============================================================
-- Programa el envío diario de recordatorios (7:00 a. m. de RD = 11:00 UTC).
-- Se ejecuta UNA vez en el SQL Editor de Supabase, DESPUÉS de:
--   1. aplicar la migración 0015,
--   2. desplegar la función `recordatorios`,
--   3. poner sus secretos (RESEND_API_KEY y CRON_SECRET).
-- Requiere las extensiones pg_cron y pg_net (Database → Extensions).
--
-- Antes de ejecutar: cambia PEGA_AQUI_EL_CRON_SECRET por el mismo valor que
-- pusiste en el secreto CRON_SECRET de la función. Queda guardado cifrado en
-- Vault; no lo subas al repositorio.
-- ============================================================

select vault.create_secret('PEGA_AQUI_EL_CRON_SECRET', 'recordatorios_cron', 'Cabecera x-cron-secret de la función recordatorios');

select cron.schedule(
  'recordatorios-diarios',
  '0 11 * * *',
  $$
  select net.http_post(
    url     := 'https://xbcdxikbvhsnyaaijqmr.supabase.co/functions/v1/recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'recordatorios_cron')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Comprobar que quedó programado:
--   select jobname, schedule, active from cron.job;
-- Ver las últimas ejecuciones:
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- Ver los correos enviados:
--   select * from public.recordatorios_envios order by creado_el desc limit 20;
-- Quitar la programación:
--   select cron.unschedule('recordatorios-diarios');
