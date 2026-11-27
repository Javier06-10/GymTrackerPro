# Recordatorios por correo al entrenador

Un correo al día, como máximo, a cada entrenador que los tenga activados (Mi cuenta →
Recordatorios por correo). **Nunca a los atletas.**

## Qué dice y cuándo llega

| Contenido | Regla (la misma que el panel) |
|---|---|
| Cobros vencidos | Atleta activo con fecha de cobro ya pasada |
| Mediciones pendientes | Atleta activo cuya última medida tiene tantos días o más que su frecuencia (30 por defecto) |
| Cumpleaños | En los próximos 7 días |
| Aviso del plan | El plan vence en 3 días, en 1, hoy, o venció ayer |

Para no ser spam, solo se envía si **hoy pasó algo nuevo**: un cobro que venció hoy,
una medición que toca hoy, un cumpleaños hoy o un aviso del plan. Los **lunes** llega
un resumen con todo lo pendiente. El correo trae las listas completas cada vez.

Sale a las 7:00 a. m. de RD desde `Coach Fénix <no-reply@coachfenix.com>`; si el
entrenador responde, llega a `hola@coachfenix.com`.

## Piezas

- `supabase/migrations/0015_recordatorios_entrenador.sql`: preferencia `perfiles.recordatorios`,
  registro `recordatorios_envios` (evita duplicados) y la consulta `recordatorios_del_dia()`.
- `supabase/functions/recordatorios/`: la función que arma el correo (`correo.ts`) y lo envía
  por Resend (`index.ts`).
- `supabase/correos/programar-recordatorios.sql`: la programación diaria (pg_cron).

## Ponerlo en marcha (una vez)

1. **Migración:** SQL Editor → pega y ejecuta `0015_recordatorios_entrenador.sql`.
2. **Clave de Resend para la función:** Resend → API Keys → *Create* →
   `Coach Fenix - Recordatorios`, permiso *Sending access*, dominio `coachfenix.com`.
3. **Secreto de la programación:** genera un valor aleatorio largo, por ejemplo en PowerShell:
   `[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))`
4. **Desplegar la función** (en la carpeta del proyecto):
   ```
   npx supabase login
   npx supabase functions deploy recordatorios --project-ref xbcdxikbvhsnyaaijqmr --no-verify-jwt
   npx supabase secrets set --project-ref xbcdxikbvhsnyaaijqmr RESEND_API_KEY=<clave del paso 2> CRON_SECRET=<valor del paso 3>
   ```
   `--no-verify-jwt` es correcto: la función no es abierta, exige la cabecera `x-cron-secret`.
5. **Probar con tu cuenta** (manda tu correo aunque hoy no toque, sin dejar registro):
   ```
   curl -X POST https://xbcdxikbvhsnyaaijqmr.supabase.co/functions/v1/recordatorios ^
     -H "x-cron-secret: <valor del paso 3>" -H "Content-Type: application/json" ^
     -d "{\"solo\":\"<tu id de entrenador>\",\"forzar\":true}"
   ```
   Responde `{"candidatos":1,"enviados":1,...}` y te llega el correo.
6. **Programar:** Database → Extensions → activa `pg_cron` y `pg_net`. Luego, en el SQL Editor,
   ejecuta `programar-recordatorios.sql` con tu `CRON_SECRET` en lugar de `PEGA_AQUI_EL_CRON_SECRET`.

## Revisar

- Envíos: `select * from public.recordatorios_envios order by creado_el desc;`
  (`error` trae el motivo exacto si Resend rechazó alguno).
- Ejecuciones: `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;`
