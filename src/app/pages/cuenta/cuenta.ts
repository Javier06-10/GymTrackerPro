import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { Plan } from '../../core/modelos';
import { supabase } from '../../core/supabase';
import { UiService } from '../../core/ui.service';
import { fmtDinero, fmtFecha } from '../../core/util';
import { ImportarRespaldo } from './importar-respaldo';
import { Icono } from '../../shared/icono';

interface PagoSuscripcion { id: string; monto: number; metodo: string; referencia: string; periodo_desde: string; periodo_hasta: string; plan_id: number }

const ETIQUETA_ESTADO: Record<string, string> = { prueba: 'Prueba gratis', activa: 'Activa', vencida: 'Vencida', cancelada: 'Cancelada' };

/** Perfil del entrenador, plan actual y solicitud de renovación (pago manual). */
@Component({
  selector: 'app-cuenta',
  imports: [FormsModule, ImportarRespaldo, Icono],
  template: `
    <div class="titulo-seccion" style="margin-top:0;"><app-icono nombre="tarjeta" [tam]="16" /> Mi plan</div>
    @if (auth.suscripcion(); as s) {
      <div class="grid-metricas">
        <div class="metrica" [class.m-verde]="auth.vigente()" [class.m-rojo]="!auth.vigente()">
          <div class="etiqueta">Estado</div>
          <div class="valor">{{ auth.vigente() ? etiqueta(s.estado) : 'Vencida' }}</div>
          <div class="sub">Plan {{ auth.plan()?.nombre }}</div>
        </div>
        <div class="metrica m-acero">
          <div class="etiqueta">{{ auth.vigente() ? 'Vence el' : 'Venció el' }}</div>
          <div class="valor" style="font-size:22px;">{{ fecha(s.vence_el) }}</div>
          <div class="sub">
            @if (auth.diasRestantes() >= 0) { Faltan {{ auth.diasRestantes() }} día{{ auth.diasRestantes() === 1 ? '' : 's' }} }
            @else { Hace {{ -auth.diasRestantes() }} días }
          </div>
        </div>
        <div class="metrica">
          <div class="etiqueta">Límite de atletas</div>
          <div class="valor">{{ auth.plan()?.max_atletas ?? '∞' }}</div>
          <div class="sub">Según tu plan</div>
        </div>
      </div>
    }

    <div class="grid-planes">
      @for (p of planesPago(); track p.id) {
        <div class="plan" [class.actual]="p.id === auth.suscripcion()?.plan_id">
          <div style="font-weight:800;font-size:15px;">{{ p.nombre }}</div>
          <div class="precio">{{ dinero(p.precio_mensual) }} <small>/ mes</small></div>
          <ul>
            <li><app-icono nombre="usuarios" [tam]="14" /> {{ p.max_atletas ? 'Hasta ' + p.max_atletas + ' atletas' : 'Atletas ilimitados' }}</li>
            <li><app-icono nombre="regla" [tam]="14" /> Medidas, mapa muscular y rutinas</li>
            <li><app-icono nombre="manzana" [tam]="14" /> Nutrición, asistencia y objetivos</li>
            <li><app-icono nombre="dinero" [tam]="14" /> Control de cobros y WhatsApp</li>
          </ul>
          <button class="btn" [class.btn-primario]="p.id !== auth.suscripcion()?.plan_id" [class.btn-suave]="p.id === auth.suscripcion()?.plan_id"
            style="justify-content:center;margin-top:auto;" (click)="solicitar(p)">
            {{ p.id === auth.suscripcion()?.plan_id ? 'Renovar este plan' : 'Elegir ' + p.nombre }}
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

    <div class="titulo-seccion"><app-icono nombre="persona" [tam]="16" /> Mi perfil de entrenador</div>
    <div class="tarjeta" style="display:flex;flex-direction:column;gap:14px;">
      <div class="form-grid">
        <div class="campo"><label>Tu nombre (firma de los mensajes)</label><input [(ngModel)]="perfil.nombre" /></div>
        <div class="campo"><label>Nombre del negocio</label><input [(ngModel)]="perfil.negocio" /></div>
        <div class="campo"><label>Teléfono</label><input type="tel" [(ngModel)]="perfil.telefono" /></div>
      </div>
      <div class="campo">
        <label>Logo del negocio (JPG o PNG)</label>
        <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
          @if (perfil.logo_url) {
            <img [src]="perfil.logo_url" alt="logo" style="width:72px;height:72px;object-fit:contain;border-radius:12px;background:#fff;padding:4px;" />
          }
          <input type="file" accept="image/*" (change)="subirLogo($event)"
            style="flex:1;min-width:200px;padding:10px;background:var(--panel2);border:1px dashed var(--borde);border-radius:8px;color:var(--texto-suave);font-family:inherit;font-size:13px;" />
          @if (perfil.logo_url) { <button class="btn btn-fantasma btn-mini" style="color:var(--rojo);" (click)="perfil.logo_url = null">Quitar logo</button> }
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn btn-primario" (click)="guardarPerfil()">Guardar perfil</button>
      </div>
    </div>

    <div class="titulo-seccion"><app-icono nombre="subir" [tam]="16" /> Importar desde la versión anterior</div>
    <app-importar-respaldo />

    <div class="titulo-seccion"><app-icono nombre="candado" [tam]="16" /> Seguridad</div>
    <div class="tarjeta" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
      <div class="campo" style="flex:1;min-width:220px;">
        <label>Nueva contraseña · {{ auth.perfil()?.email }}</label>
        <input type="password" [(ngModel)]="clave" autocomplete="new-password" minlength="6" />
      </div>
      <button class="btn btn-suave" (click)="cambiarClave()">Cambiar contraseña</button>
    </div>
  `,
})
export class Cuenta implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);
  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;
  protected etiqueta(e: string) { return ETIQUETA_ESTADO[e] ?? e; }

  protected readonly planesPago = computed(() => this.auth.planes().filter((p) => p.codigo !== 'prueba'));
  protected readonly historial = signal<PagoSuscripcion[]>([]);
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
