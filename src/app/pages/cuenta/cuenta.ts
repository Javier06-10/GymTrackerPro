import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { Sistema, UnidadesService } from '../../core/unidades';
import { TEMAS, Tema, TemaService } from '../../core/tema.service';
import { Plan } from '../../core/modelos';
import { supabase } from '../../core/supabase';
import { UiService } from '../../core/ui.service';
import { diasDesde, fmtDinero, fmtFecha, iniciales } from '../../core/util';
import { ImportarRespaldo } from './importar-respaldo';
import { Icono } from '../../shared/icono';

interface PagoSuscripcion { id: string; monto: number; metodo: string; referencia: string; periodo_desde: string; periodo_hasta: string; plan_id: number }


/** Perfil del entrenador, plan actual y solicitud de renovación (pago manual). */
@Component({
  selector: 'app-cuenta',
  imports: [FormsModule, ImportarRespaldo, Icono],
  template: `
    <section class="cab-pagina">
      <div class="cab-ico"><app-icono nombre="persona" [tam]="24" /></div>
      <div class="cab-texto">
        <h1>Mi cuenta</h1>
        <p>Tu plan, tu perfil profesional y la seguridad de tu acceso.</p>
      </div>
    </section>

    @if (auth.suscripcion(); as s) {
      <section class="estado-plan" [class.vencido]="!auth.vigente()">
        <div class="ep-principal">
          <div class="ep-etq">Plan actual</div>
          <div class="ep-nombre">{{ auth.plan()?.nombre }}</div>
          <span [class]="'chip ' + (auth.vigente() ? (s.estado === 'prueba' ? 'chip-ambar' : 'chip-verde') : 'chip-rojo')">
            <app-icono [nombre]="auth.vigente() ? 'check' : 'alerta'" [tam]="12" /> {{ !auth.vigente() ? 'Vencida' : s.estado === 'prueba' ? 'Vigente · 14 días gratis' : 'Vigente' }}
          </span>
        </div>
        <div class="ep-medidor">
          <div class="ep-fila">
            <span><app-icono nombre="calendario" [tam]="15" /> {{ auth.vigente() ? 'Vence el' : 'Venció el' }} <b>{{ fecha(s.vence_el) }}</b></span>
            <span class="ep-valor">
              @if (auth.diasRestantes() >= 0) { {{ auth.diasRestantes() }} día{{ auth.diasRestantes() === 1 ? '' : 's' }} }
              @else { hace {{ -auth.diasRestantes() }} días }
            </span>
          </div>
          <div class="barra-uso" [class.alerta]="auth.diasRestantes() <= 5"><span [style.width.%]="pctTiempo()"></span></div>
          <div class="ep-fila">
            <span><app-icono nombre="usuarios" [tam]="15" /> Atletas registrados</span>
            <span class="ep-valor">{{ usados() }} / {{ auth.plan()?.max_atletas ?? '∞' }}</span>
          </div>
          <div class="barra-uso" [class.alerta]="pctAtletas() >= 90"><span [style.width.%]="pctAtletas()"></span></div>
        </div>
      </section>
    }

    <div class="titulo-seccion"><app-icono nombre="tarjeta" [tam]="16" /> Planes</div>
    <div class="grid-planes">
      @for (p of planesPago(); track p.id) {
        @let actual = p.id === auth.suscripcion()?.plan_id;
        <div class="plan" [class.actual]="actual" [class.destacado]="p.codigo === 'pro'">
          @if (actual) { <span class="plan-sello">Tu plan</span> }
          @else if (p.codigo === 'pro') { <span class="plan-sello popular"><app-icono nombre="estrella" [tam]="12" /> Más popular</span> }
          <div class="plan-ico"><app-icono [nombre]="p.codigo === 'basico' ? 'pesa' : p.codigo === 'pro' ? 'fuego' : 'estrella'" [tam]="20" /></div>
          <div class="plan-nombre">{{ p.nombre }}</div>
          <div class="precio">{{ dinero(p.precio_mensual) }} <small>/ mes</small></div>
          <div class="plan-cupo">{{ p.max_atletas ? 'Hasta ' + p.max_atletas + ' atletas' : 'Atletas ilimitados' }}</div>
          <ul>
            @for (b of beneficios; track b) { <li><span class="plan-check"><app-icono nombre="check" [tam]="12" /></span> {{ b }}</li> }
          </ul>
          <button class="btn" [class.btn-primario]="!actual" [class.btn-suave]="actual" (click)="solicitar(p)">
            <app-icono [nombre]="actual ? 'recargar' : 'chat'" [tam]="15" /> {{ actual ? 'Renovar este plan' : 'Elegir ' + p.nombre }}
          </button>
        </div>
      }
    </div>
    <div class="nota-info" style="margin-top:12px;">
      Los pagos se hacen por transferencia. Al elegir un plan se abre WhatsApp con tu solicitud; en cuanto confirmemos el pago, tu plan se activa.
    </div>

    @if (historial().length) {
      <div class="titulo-seccion"><app-icono nombre="recibo" [tam]="16" /> Historial de pagos del plan</div>
      <div class="tabla-scroll"><table>
        <tr><th>Período</th><th>Plan</th><th>Monto</th><th>Método</th><th>Referencia</th></tr>
        @for (h of historial(); track h.id) {
          <tr>
            <td>{{ fecha(h.periodo_desde) }} → {{ fecha(h.periodo_hasta) }}</td>
            <td>{{ nombrePlan(h.plan_id) }}</td>
            <td><b style="color:var(--verde)">{{ dinero(h.monto) }}</b></td>
            <td>{{ h.metodo }}</td>
            <td>{{ h.referencia || '—' }}</td>
          </tr>
        }
      </table></div>
    }

    <div class="titulo-seccion"><app-icono nombre="persona" [tam]="16" /> Perfil profesional</div>
    <div class="tarjeta perfil-pro">
      <div class="logo-zona">
        <div class="logo-vista">
          @if (perfil.logo_url) { <img [src]="perfil.logo_url" alt="Logo del negocio" /> }
          @else { <span>{{ inicialesNegocio() }}</span> }
        </div>
        <div class="logo-botones">
          <label class="btn btn-suave btn-mini">
            <app-icono nombre="subir" [tam]="14" /> {{ perfil.logo_url ? 'Cambiar logo' : 'Subir logo' }}
            <input type="file" accept="image/*" hidden (change)="subirLogo($event)" />
          </label>
          @if (perfil.logo_url) {
            <button class="btn btn-fantasma btn-mini" style="color:var(--rojo);" (click)="perfil.logo_url = null">Quitar</button>
          }
        </div>
        <small>Sale en los PDF de progreso y en los recibos.</small>
      </div>
      <div class="perfil-campos">
        <div class="form-grid">
          <div class="campo"><label>Tu nombre (firma de los mensajes)</label><input [(ngModel)]="perfil.nombre" /></div>
          <div class="campo"><label>Nombre del negocio</label><input [(ngModel)]="perfil.negocio" /></div>
        </div>
        <div class="form-grid">
          <div class="campo"><label>Teléfono</label><input type="tel" [(ngModel)]="perfil.telefono" /></div>
          <div class="campo"><label>Correo de acceso</label><input [value]="auth.perfil()?.email ?? ''" disabled /></div>
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <button class="btn btn-primario" (click)="guardarPerfil()"><app-icono nombre="guardar" [tam]="15" /> Guardar perfil</button>
        </div>
      </div>
    </div>

    <div class="titulo-seccion"><app-icono nombre="estrella" [tam]="16" /> Tema de la app</div>
    <div class="grid-temas" role="radiogroup" aria-label="Tema de la app">
      @for (t of temas; track t.v) {
        <button class="op-tema" role="radio" [attr.aria-checked]="tema.tema() === t.v" [class.activa]="tema.tema() === t.v"
          [disabled]="guardandoTema()" (click)="cambiarTema(t.v)">
          <span class="ot-vista" [style.background]="t.muestras[0]">
            <span class="ot-barra" [style.background]="t.muestras[1]"></span>
            <span class="ot-tarjeta" [style.background]="t.muestras[1]" [style.opacity]="t.v === 'fuerza' || t.v === 'bienestar' ? .18 : 1"></span>
            <span class="ot-boton" [style.background]="t.muestras[2]"></span>
            <span class="ot-punto" [style.background]="t.muestras[3]"></span>
          </span>
          <span class="ot-t">@if (tema.tema() === t.v) { <app-icono nombre="check" [tam]="14" /> }{{ t.t }}</span>
          <span class="ot-s">{{ t.s }}</span>
        </button>
      }
    </div>

    <div class="titulo-seccion"><app-icono nombre="balanza" [tam]="16" /> Unidades de medida</div>
    <div class="tarjeta unidades-pref">
      <div class="up-texto">
        <b>¿Cómo trabajas el peso y las medidas?</b>
        <span>Se aplica a medidas, gráficas, objetivos, nutrición y PDFs. Puedes cambiarlo cuando quieras: los datos ya guardados se convierten solos.</span>
      </div>
      <div class="opciones-unidad" role="radiogroup" aria-label="Unidades de medida">
        @for (o of opcionesUnidad; track o.v) {
          <button class="op-unidad" role="radio" [attr.aria-checked]="unidades.sistema() === o.v" [class.activa]="unidades.sistema() === o.v"
            [disabled]="guardandoUnidades()" (click)="cambiarUnidades(o.v)">
            <span class="ou-check"><app-icono nombre="check" [tam]="13" /></span>
            <span class="ou-t">{{ o.t }}</span>
            <span class="ou-s">{{ o.s }}</span>
          </button>
        }
      </div>
    </div>

    <div class="grid-cuenta-extra">
      <div>
        <div class="titulo-seccion"><app-icono nombre="subir" [tam]="16" /> Importar versión anterior</div>
        <app-importar-respaldo />
      </div>
      <div>
        <div class="titulo-seccion"><app-icono nombre="candado" [tam]="16" /> Seguridad</div>
        <div class="tarjeta" style="display:flex;flex-direction:column;gap:12px;">
          <div class="sello-mini"><app-icono nombre="escudo" [tam]="18" /> Tu sesión viaja cifrada y solo tú ves a tus atletas.</div>
          <div class="campo">
            <label>Nueva contraseña</label>
            <input type="password" [(ngModel)]="clave" autocomplete="new-password" minlength="6" placeholder="Mínimo 6 caracteres" />
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <button class="btn btn-suave" (click)="cambiarClave()"><app-icono nombre="candado" [tam]="15" /> Cambiar contraseña</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class Cuenta implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);
  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;

  protected readonly planesPago = computed(() => this.auth.planes().filter((p) => p.codigo !== 'prueba'));
  protected readonly historial = signal<PagoSuscripcion[]>([]);
  private readonly datos = inject(DatosService);
  protected readonly beneficios = ['Medidas con mapa muscular', 'Rutinas e historial de cargas', 'Nutrición, asistencia y objetivos', 'Cobros, recibos y WhatsApp', 'Reportes en PDF'];

  protected readonly usados = computed(() => this.datos.atletas().length);
  protected readonly pctAtletas = computed(() => {
    const max = this.auth.plan()?.max_atletas;
    return max ? Math.min(100, Math.round((this.usados() / max) * 100)) : 8;
  });
  /** Parte del período que queda: la prueba dura 14 días; un plan pagado, desde el inicio del último período. */
  protected readonly pctTiempo = computed(() => {
    const s = this.auth.suscripcion();
    const quedan = this.auth.diasRestantes();
    if (!s || quedan < 0) return 0;
    const ultimo = this.historial()[0];
    const total = s.estado === 'prueba' || !ultimo ? 14 : Math.max(1, (diasDesde(ultimo.periodo_desde) ?? 0) + quedan);
    return Math.max(4, Math.min(100, Math.round((quedan / total) * 100)));
  });
  protected inicialesNegocio() {
    // Sin artículos ni preposiciones: "Gym de Prueba" → "GP"
    const texto = (this.perfil.negocio || this.perfil.nombre || 'GymTracker').replace(/\b(de|del|la|las|el|los|y)\b/gi, ' ');
    return iniciales(texto);
  }
  protected perfil = { nombre: '', negocio: '', telefono: '', logo_url: null as string | null };
  protected clave = '';

  ngOnInit() {
    const p = this.auth.perfil();
    if (p) this.perfil = { nombre: p.nombre, negocio: p.negocio, telefono: p.telefono, logo_url: p.logo_url };
    this.cargarHistorial();
  }

  private async cargarHistorial() {
    const { data } = await supabase.from('pagos_suscripcion').select('*').order('periodo_desde', { ascending: false });
    this.historial.set((data as PagoSuscripcion[]) ?? []);
  }

  nombrePlan(id: number) {
    return this.auth.planes().find((p) => p.id === id)?.nombre ?? '—';
  }

  solicitar(p: Plan) {
    const perfil = this.auth.perfil();
    const msj =
      `Hola 👋 Quiero ${p.id === this.auth.suscripcion()?.plan_id ? 'renovar' : 'activar'} el plan *${p.nombre}* ` +
      `(${fmtDinero(p.precio_mensual)}/mes) de GymTracker Pro.\n\nCuenta: ${perfil?.email}\nNombre: ${perfil?.nombre}`;
    window.open('https://wa.me/' + environment.whatsappVentas + '?text=' + encodeURIComponent(msj), '_blank');
  }

  /** Redimensiona a 240px y guarda como JPEG en base64 (igual que la plantilla). */
  subirLogo(ev: Event) {
    const archivo = (ev.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 240;
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        this.perfil.logo_url = cv.toDataURL('image/jpeg', 0.92);
      };
      img.onerror = () => this.ui.toast('No se pudo leer la imagen', 'err');
      img.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  }

  protected readonly unidades = inject(UnidadesService);
  protected readonly guardandoUnidades = signal(false);
  protected readonly tema = inject(TemaService);
  protected readonly temas = TEMAS;
  protected readonly guardandoTema = signal(false);

  async cambiarTema(t: Tema) {
    if (t === this.tema.tema()) return;
    this.guardandoTema.set(true);
    try {
      await this.tema.elegir(t);
      this.ui.toast('Tema aplicado ✓');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardandoTema.set(false);
    }
  }

  protected readonly opcionesUnidad: { v: Sistema; t: string; s: string }[] = [
    { v: 'imperial', t: 'Libras y pulgadas', s: 'lb · in · pies' },
    { v: 'metrico', t: 'Kilos y centímetros', s: 'kg · cm' },
  ];

  async cambiarUnidades(v: Sistema) {
    if (v === this.unidades.sistema()) return;
    this.guardandoUnidades.set(true);
    try {
      await this.auth.actualizarPerfil({ unidades: v });
      this.ui.toast(v === 'metrico' ? 'Ahora trabajas en kilos y centímetros ✓' : 'Ahora trabajas en libras y pulgadas ✓');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardandoUnidades.set(false);
    }
  }

  async guardarPerfil() {
    try {
      await this.auth.actualizarPerfil({ ...this.perfil, nombre: this.perfil.nombre.trim(), negocio: this.perfil.negocio.trim(), telefono: this.perfil.telefono.trim() });
      this.ui.toast('Perfil guardado ✓');
    } catch (e) {
      this.ui.error(e);
    }
  }

  async cambiarClave() {
    if (this.clave.length < 6) return this.ui.toast('La contraseña debe tener al menos 6 caracteres', 'err');
    try {
      await this.auth.cambiarClave(this.clave);
      this.clave = '';
      this.ui.toast('Contraseña actualizada ✓');
    } catch (e) {
      this.ui.error(e);
    }
  }
}
