# Correos de Coach Fénix con Resend

Los correos de acceso (confirmar cuenta, reenviar confirmación, cambiar contraseña,
cambiar correo) los manda **Supabase Auth**. Sin SMTP propio salen por el servidor de
prueba de Supabase: muy pocos por hora y a menudo en spam. Con esta configuración salen
por **Resend** desde `no-reply@coachfenix.com`.

Nada de esto vive en el código: se configura en tres paneles. Este archivo es el registro.

## 1. Resend: dominio

Resend → **Domains → Add Domain**

- Dominio: `coachfenix.com`
- Región: **us-east-1** (la más cercana a RD)

Resend muestra unos registros DNS (normalmente 3 o 4). Cópialos tal cual a Cloudflare.

## 2. Cloudflare: registros DNS

Cloudflare → `coachfenix.com` → **DNS → Records → Add record**, uno por cada registro
que dio Resend. Suelen ser:

| Tipo | Nombre | Para qué |
|---|---|---|
| TXT | `resend._domainkey` | DKIM: firma los correos |
| MX | `send` (prioridad 10) | Rebotes |
| TXT | `send` | SPF del subdominio de envío |

- En los TXT y MX, el proxy (nube naranja) **no aplica**: quedan en "DNS only".
- **No tocan** el MX ni el SPF de la raíz que usa Cloudflare Email Routing para
  `hola@coachfenix.com`: Resend envía desde el subdominio `send`, así que conviven.
- Si aún no existe, añade también DMARC:
  `TXT` · `_dmarc` · `v=DMARC1; p=none; rua=mailto:hola@coachfenix.com`

Vuelve a Resend y pulsa **Verify**. Suele tardar minutos (a veces hasta una hora).

## 3. Resend: clave de API

Resend → **API Keys → Create API Key**

- Nombre: `Coach Fenix - Supabase Auth`
- Permiso: **Sending access** (solo envío)
- Dominio: `coachfenix.com`

Cópiala en ese momento (Resend no la vuelve a mostrar). No la guardes en el repo.

## 4. Supabase: SMTP propio

Proyecto `xbcdxikbvhsnyaaijqmr` → **Authentication → Emails → SMTP Settings** →
*Enable custom SMTP*

| Campo | Valor |
|---|---|
| Sender email | `no-reply@coachfenix.com` |
| Sender name | `Coach Fénix` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | la clave de API del paso 3 |
| Minimum interval | 60 segundos (por defecto) |

Después: **Authentication → Rate Limits** → sube *emails sent per hour* (con SMTP
propio deja de estar fijado en el mínimo; 100/h está bien para empezar; el plan gratis
de Resend permite 100 al día y 3.000 al mes).

## 5. Supabase: direcciones de retorno

**Authentication → URL Configuration**

- Site URL: `https://coachfenix.com`
- Redirect URLs (la app envía a `/login` y a `/cuenta`):
  - `https://coachfenix.com/**`
  - `http://localhost:4200/**` (desarrollo)

Si falta alguna, el enlace del correo te lleva a la Site URL en vez de a la pantalla
correcta.

## 6. Supabase: plantillas en español

**Authentication → Emails → Templates**. En cada una, pega el asunto y el HTML:

| Plantilla de Supabase | Asunto | Archivo |
|---|---|---|
| Confirm signup | `Confirma tu cuenta de Coach Fénix` | `confirmar-cuenta.html` |
| Reset Password | `Cambia tu contraseña de Coach Fénix` | `cambiar-contrasena.html` |
| Change Email Address | `Confirma tu nuevo correo en Coach Fénix` | `cambiar-correo.html` |

El logo se carga de `https://coachfenix.com/icons/icon-192x192.png`: tiene que estar
desplegado para que se vea.

## 7. Prueba

1. Regístrate con un correo tuyo real en `https://coachfenix.com/registro`.
2. Comprueba que llega a la bandeja de entrada (no spam), con remitente
   `Coach Fénix <no-reply@coachfenix.com>`, y que el botón te deja entrar.
3. Pide "¿Olvidaste tu contraseña?" y comprueba que el enlace abre `/cuenta`.
4. En Resend → **Emails** debe aparecer cada envío como *Delivered*.

## Si algo falla

- **No llega nada:** Supabase → Logs → Auth. Un error de autenticación SMTP = clave mal
  copiada o sin permiso para el dominio.
- **Llega a spam:** revisa que el dominio esté *Verified* en Resend y que DKIM y SPF
  estén en verde.
- La función `admin_confirmar_correo` (migración 0006) sigue disponible para confirmar
  cuentas a mano desde el panel de administración.
