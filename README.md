# GymTracker Pro — SaaS para entrenadores

App web para entrenadores personales: atletas, medidas con avatar anatómico, rutinas, nutrición,
asistencia, objetivos y cobros. Se vende por **suscripción mensual** al entrenador.

Nació de la plantilla `gymtracker_pro_5.html` (un solo archivo con `localStorage`) y se portó a
**Angular 20 + Supabase** (Postgres + Auth + RLS multi-entrenador).

## Correr en local

```bash
npm install
npm start          # http://localhost:4200
```

La conexión a Supabase está en `src/environments/environment.ts` (URL + clave publicable; es segura
en el cliente porque el acceso lo controla RLS). Ahí también va `whatsappVentas`, el número al que
llegan las solicitudes de plan.

## Estructura

```
src/app/
  core/         modelos, util (fechas/dinero), dominio (reglas de negocio de la plantilla),
                catalogo (93 ejercicios), avatar (SVG anatómico + gráfica), supabase,
                auth.service (sesión/perfil/suscripción), datos.service (atletas y relaciones),
                ui.service (toast/confirmar), guards, whatsapp
  layout/shell  encabezado, navegación, aviso de suscripción
  pages/
    auth/       login (con recuperar contraseña) y registro (14 días de prueba)
    panel/      dashboard: ingresos, cobros vencidos, cumpleaños, mediciones pendientes, atletas, grupos
    atleta/     ficha con 8 pestañas: perfil, medidas, rutinas, nutrición, asistencia, objetivos, bitácora, pagos
    cuenta/     plan actual, planes, historial de pagos del plan, perfil y logo, contraseña
    admin/      (solo rol admin) entrenadores, estado de suscripción, registrar pago manual, +7 días, cancelar
supabase/migrations/   SQL aplicado al proyecto (en orden)
```

## Modelo SaaS

- Cada entrenador es un tenant: todas las tablas llevan `trainer_id` y **RLS** solo deja ver lo propio.
- Al registrarse, un trigger crea su `perfil` y una `suscripcion` en **prueba de 14 días** (plan *prueba*, 10 atletas).
- Escribir (crear/editar/borrar) exige `suscripcion_vigente()`; con el plan vencido el entrenador
  puede **ver** pero no guardar.
- El límite de atletas por plan lo valida un trigger en la base de datos.
- **Cobro manual** (por ahora): el entrenador pide el plan por WhatsApp desde *Mi cuenta*; el admin
  registra el pago en *Admin* (RPC `admin_registrar_pago_suscripcion`), que guarda el pago y extiende la vigencia.

Planes semilla: Prueba (10 atletas) · Básico $9.99 (25) · Pro $19.99 (100) · Élite $34.99 (ilimitado).
Se editan en la tabla `planes`.

### Hacer admin a una cuenta

```sql
update public.perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

## PDFs

Generados sin librerías en `core/pdf.ts` (portado de la plantilla), firmados con el nombre, negocio y logo del entrenador:
- **Progreso físico** (Medidas → 📄 Exportar PDF): comparación de las 2 últimas mediciones, objetivos y gráficas (2 páginas).
- **Recibo de pago** (Pagos → 🧾 en cada fila).
- **Reporte mensual del negocio** (Panel → 📊 Reporte).

## Manual del entrenador

`/manual` (menú *Manual*): los 13 capítulos de la plantilla con figuras y fichas, navegables (`?cap=`). El contenido vive en `core/manual.ts`.

## Importar respaldo de la versión anterior

*Mi cuenta → 📥 Importar*: sube el `GymTracker_Respaldo_….json` de la plantilla HTML. `core/respaldo.ts` valida y limpia el archivo (lo trata como dato no confiable) y la RPC `importar_respaldo` lo inserta en una sola transacción respetando RLS y el límite del plan (si no caben todos, primero los activos). Los atletas se agregan; no se borra nada.

## App instalable (PWA)

En producción la app registra el service worker de Angular (`ngsw-config.json`) y se puede instalar en el teléfono o el escritorio:

- **Android / Chrome / Edge**: botón *Instalar app* en el encabezado o en el menú (usa el diálogo nativo, `core/pwa.service.ts`).
- **iPhone / iPad**: el mismo botón muestra los pasos de Safari → Compartir → *Agregar a inicio*.
- La app (HTML, JS, CSS, iconos y fuentes) queda en caché y abre al instante; los datos de Supabase **no** se cachean, siempre vienen de la red.
- Al publicar una versión nueva aparece el aviso *Hay una versión nueva → Actualizar* (se revisa al abrir y cada 30 min).
- Los iconos de `public/icons/` se generan desde el logo de la pesa (normal, *maskable* para Android y `apple-touch-icon`).
- `render.yaml` sirve `ngsw-worker.js`, `ngsw.json`, `index.html` y el manifest con `Cache-Control: no-cache` para que las actualizaciones lleguen.

En `ng serve` el service worker está apagado; para probarlo: `npm run build` y servir `dist/GymTrackerPro/browser` con un servidor estático.

## Pendiente (siguientes fases)

- Pasarela de pago automática (Stripe / PayPal) con webhooks.
- Portal del atleta, unidades kg/cm.
- Configurar URL del sitio y SMTP propio en Supabase Auth.
