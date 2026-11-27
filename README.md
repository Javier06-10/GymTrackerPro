# Coach Fénix — SaaS para entrenadores

App web para entrenadores personales: atletas, medidas con avatar anatómico y % de grasa, rutinas,
nutrición, asistencia, objetivos y cobros. Se vende por **suscripción mensual** al entrenador.

Nació de la plantilla `gymtracker_pro_5.html` (un solo archivo con `localStorage`) y se portó a
**Angular 20 + Supabase** (Postgres + Auth + RLS multi-entrenador + Edge Functions).

## Correr en local

```bash
npm install
npm start                                        # http://localhost:4200
npx ng test --watch=false --browsers=ChromeHeadless   # pruebas (Karma + Jasmine)
npm run build                                    # producción → dist/GymTrackerPro/browser
```

La conexión a Supabase está en `src/environments/environment.ts` (URL + clave publicable; es segura
en el cliente porque el acceso lo controla RLS). Ahí también va `whatsappVentas`, el número al que
llegan las solicitudes de plan.

Producción: **Render** (`render.yaml`), proyecto Supabase `xbcdxikbvhsnyaaijqmr`.

## Estructura

```
src/app/
  core/         modelos, util (fechas/dinero), dominio (reglas de negocio de la plantilla),
                catalogo (93 ejercicios), avatar (SVG anatómico + gráfica), grasa (% de grasa),
                supabase, leer-todo (lectura paginada), auth.service (sesión/perfil/suscripción),
                datos.service (atletas y relaciones), rutinas-compartidas.service, tema.service,
                unidades, pdf, manual, respaldo, pwa.service, ui.service (toast/confirmar), guards
  layout/shell  encabezado, navegación, aviso de suscripción, rutinas recibidas
  pages/
    auth/       login (con recuperar contraseña) y registro (14 días de prueba)
    panel/      dashboard: ingresos, cobros vencidos, cumpleaños, mediciones pendientes, atletas, grupos
    atleta/     ficha con 8 pestañas: perfil, medidas, rutinas, nutrición (+ plan de comidas),
                asistencia, objetivos, bitácora, pagos
    asistencia/ pasar lista del día a todos los atletas
    cuenta/     plan, historial de pagos, perfil y logo, tema, unidades, recordatorios, contraseña, importar
    manual/     manual del entrenador (13 capítulos)
    legal/      privacidad y términos
    admin/      (solo rol admin) entrenadores, suscripciones, pagos manuales, catálogo de planes, estado de correos
supabase/
  migrations/   SQL aplicado al proyecto (en orden, 0001–0016)
  functions/    Edge Function `recordatorios`
  correos/      plantillas de Auth en español, guía de Resend y de recordatorios
```

## Modelo SaaS

- Cada entrenador es un tenant: todas las tablas llevan `trainer_id` y **RLS** solo deja ver lo propio.
- Al registrarse, un trigger crea su `perfil` y una `suscripcion` en **prueba de 14 días** (plan *prueba*, 10 atletas).
- Escribir (crear/editar/borrar) exige `suscripcion_vigente()`; con el plan vencido el entrenador
  puede **ver** pero no guardar.
- El límite de atletas por plan lo valida un trigger en la base de datos.
- **Cobro manual** (por ahora): el entrenador pide el plan por WhatsApp desde *Mi cuenta*; el admin
  registra el pago en *Admin* (RPC `admin_registrar_pago_suscripcion`), que guarda el pago y extiende la vigencia.

Planes (precios de lanzamiento, migración `0012`): Prueba (10 atletas) · Básico $5 (25) · Pro $10 (100) ·
Élite $18 (ilimitado). El admin los edita desde *Admin* (precio, cupo, descripción, destacado, activo).

### Hacer admin a una cuenta

```sql
update public.perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

## Marca y temas

Logo del fénix, tipografías Inter (texto) y Space Grotesk (títulos), escala tipográfica `--t-*` y
márgenes `--margen` en `src/styles.scss`. Cada entrenador elige tema en *Mi cuenta*
(`perfiles.tema`, `core/tema.service.ts`); las cuentas nuevas empiezan en **marca-oscuro**
(migración `0013`). Las existentes conservan el que tenían.

## Medidas y % de grasa

- Perímetros, peso y avatar anatómico por medición; gráficas de cada zona en el tiempo.
- **% de grasa estimado** con la fórmula de la Marina de EE. UU. (`core/grasa.ts`): hombres usan
  cintura al ombligo y cuello; mujeres, cintura estrecha, cadera y cuello; más la estatura del perfil.
  Muestra categoría ACE, masa grasa y magra, gráfica y fila en el PDF de progreso.
  Requiere la medida del **cuello** (migración `0016`); las mediciones sin ella simplemente no lo calculan.
- Es una estimación (±3–4 %): sirve para seguir la tendencia de un mismo atleta.

## Datos: paginación y ediciones simultáneas

- PostgREST devuelve como máximo 1.000 filas por consulta: todas las lecturas grandes pasan por
  `core/leer-todo.ts`, que pide por páginas (`range`) con orden estable hasta vaciar.
- **Rutina** y **objetivos** llevan revisión (`rutina_rev`, `objetivos_rev`, migración `0014`): si otro
  dispositivo guardó antes, el cambio se rechaza, se recarga lo último y se avisa en vez de pisarlo.
- **Asistencia** se marca día por día con la RPC `marcar_asistencia`, que fusiona solo esa fecha.

## Rutinas compartidas

Un entrenador envía una rutina por correo de otro entrenador (migración `0009`); el que la recibe la
ve en *Rutinas recibidas* y la aplica a sus atletas o la descarta.

## Correos (Resend)

- **Auth** (confirmar cuenta, recuperar contraseña, cambiar correo): Supabase Auth por **SMTP de Resend**
  desde el dominio `coachfenix.com`. Plantillas en español y pasos de DNS/SMTP en `supabase/correos/README.md`.
- **Recordatorios diarios al entrenador** (nunca a los atletas): cobros vencidos, mediciones pendientes,
  cumpleaños y aviso de vencimiento del plan. Los lunes, resumen de todo lo pendiente; el resto de días solo si hoy pasó algo nuevo.
  - SQL: `recordatorios_del_dia()` y registro `recordatorios_envios` (un envío por entrenador y día), migración `0015`.
  - Edge Function `supabase/functions/recordatorios` (desplegada como `bright-api`), secretos
    `RESEND_API_KEY` y `CRON_SECRET`.
  - Programación con pg_cron + pg_net: `supabase/correos/programar-recordatorios.sql`
    (7:00 a. m. hora de RD). Guía completa en `supabase/correos/recordatorios.md`.
  - Cada entrenador los apaga en *Mi cuenta → Recordatorios por correo*.

## PDFs

Generados sin librerías en `core/pdf.ts` (portado de la plantilla), firmados con el nombre, negocio y logo del entrenador:
- **Progreso físico** (Medidas → 📄 Exportar PDF): comparación de las 2 últimas mediciones (incluye % de grasa), objetivos y gráficas (2 páginas).
- **Recibo de pago** (Pagos → 🧾 en cada fila).
- **Reporte mensual del negocio** (Panel → 📊 Reporte).

## Manual del entrenador

`/manual` (menú *Manual*): los 13 capítulos de la plantilla con figuras y fichas, navegables (`?cap=`). El contenido vive en `core/manual.ts`.

## Importar respaldo de la versión anterior

*Mi cuenta → 📥 Importar*: sube el `GymTracker_Respaldo_….json` de la plantilla HTML. `core/respaldo.ts` valida y limpia el archivo (lo trata como dato no confiable) y la RPC `importar_respaldo` lo inserta en una sola transacción respetando RLS y el límite del plan (si no caben todos, primero los activos). Los atletas se agregan; no se borra nada.

## Unidades de medida (lb/in o kg/cm)

Cada entrenador elige en *Mi cuenta → Unidades de medida* si trabaja en **libras y pulgadas** o en **kilos y centímetros** (`perfiles.unidades`, migración `0005_unidades.sql`).

- En la base todo se sigue guardando en **libras y pulgadas** (estatura en pies + pulgadas); `core/unidades.ts` convierte al mostrar y al capturar. Cambiar la preferencia no modifica ningún dato.
- Las columnas de medidas tienen 3 decimales para que kg → lb → kg y cm → in → cm vuelvan al mismo número.
- Las diferencias (“-7.2 kg desde el inicio”) se calculan restando los valores ya convertidos, así cuadran con las tablas.
- Aplica a medidas, gráficas, objetivos, nutrición, ficha del atleta, panel y PDFs. El peso de trabajo de las rutinas es texto libre (“60 lb”, “27 kg”) y no se convierte.

## App instalable (PWA)

En producción la app registra el service worker de Angular (`ngsw-config.json`) y se puede instalar en el teléfono o el escritorio:

- **Android / Chrome / Edge**: botón *Instalar app* en el encabezado o en el menú (usa el diálogo nativo, `core/pwa.service.ts`).
- **iPhone / iPad**: el mismo botón muestra los pasos de Safari → Compartir → *Agregar a inicio*.
- La app (HTML, JS, CSS, iconos y fuentes) queda en caché y abre al instante; los datos de Supabase **no** se cachean, siempre vienen de la red.
- Al publicar una versión nueva aparece el aviso *Hay una versión nueva → Actualizar* (se revisa al abrir y cada 30 min).
- Los iconos de `public/icons/` se generan desde el logo del fénix (normal, *maskable* para Android y `apple-touch-icon`).
- `render.yaml` sirve `ngsw-worker.js`, `ngsw.json`, `index.html` y el manifest con `Cache-Control: no-cache` para que las actualizaciones lleguen.

En `ng serve` el service worker está apagado; para probarlo: `npm run build` y servir `dist/GymTrackerPro/browser` con un servidor estático.

## Migraciones

Se aplican en orden desde *Supabase → SQL Editor* (o `supabase db push`). Si una pantalla falla al
guardar justo después de publicar, lo primero es revisar que la última migración esté aplicada.

## Pendiente (siguientes fases)

- Pasarela de pago automática (Stripe / PayPal) con webhooks.
- Portal del atleta.
- Fotos de progreso por medición.
- CI en GitHub (build + pruebas en cada push).
- Registro DMARC del dominio de correo.
