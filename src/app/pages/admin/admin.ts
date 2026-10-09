import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Perfil, Suscripcion } from '../../core/modelos';
import { supabase } from '../../core/supabase';
import { UiService } from '../../core/ui.service';
import { diasDesde, esc, fmtDinero, fmtFecha, hoyISO, normalizar, sumarDias } from '../../core/util';
import { Modal } from '../../shared/modal';
import { Icono } from '../../shared/icono';

type Entrenador = Perfil & { created_at: string; suscripciones: Suscripcion | null };

/** Administración del SaaS: entrenadores, estado de suscripción y registro de pagos manuales. */
@Component({
  selector: 'app-admin',
  imports: [FormsModule, Modal, Icono],
  template: `
    <div class="grid-metricas">
      <div class="metrica"><div class="etiqueta">Entrenadores</div><div class="valor">{{ lista().length }}</div></div>
      <div class="metrica m-verde"><div class="etiqueta">Suscripciones activas</div><div class="valor">{{ conteo().activas }}</div>
        <div class="sub">≈ {{ dinero(conteo().mrr) }} / mes</div></div>
      <div class="metrica m-acero"><div class="etiqueta">En prueba</div><div class="valor">{{ conteo().prueba }}</div></div>
      <div class="metrica m-rojo"><div class="etiqueta">Vencidas</div><div class="valor">{{ conteo().vencidas }}</div></div>
    </div>

    <div class="barra-busqueda">
      <div class="campo-buscar"><span class="lupa"><app-icono nombre="lupa" [tam]="16" /></span>
        <input type="text" placeholder="Buscar por nombre, negocio o correo..." [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" /></div>
      <button class="btn btn-suave" (click)="cargar()"><app-icono nombre="recargar" [tam]="15" /> Recargar</button>
    </div>

    <div class="tabla-scroll"><table>
      <tr><th>Entrenador</th><th>Correo</th><th>Plan</th><th>Estado</th><th>Vence</th><th></th></tr>
      @for (e of filtrados(); track e.id) {
        @let s = e.suscripciones;
        <tr>
          <td><b>{{ e.nombre || '—' }}</b>@if (e.negocio) { <br /><small style="color:var(--tenue)">{{ e.negocio }}</small> }</td>
          <td>{{ e.email }}</td>
          <td>{{ nombrePlan(s?.plan_id) }}</td>
          <td><span class="chip" [class]="'chip ' + chipEstado(s)">{{ estado(s) }}</span></td>
          <td>{{ fecha(s?.vence_el) }}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-primario btn-mini" (click)="abrirPago(e)"><app-icono nombre="dinero" [tam]="15" /> Registrar pago</button>
            <button class="btn btn-suave btn-mini" (click)="extenderPrueba(e)" title="Sumar 7 días">+7 días</button>
            @if (s?.estado !== 'cancelada') { <button class="btn btn-peligro btn-mini" (click)="cancelar(e)">Cancelar</button> }
          </td>
        </tr>
      } @empty {
        <tr><td colspan="6" style="text-align:center;color:var(--tenue);">Sin entrenadores.</td></tr>
      }
    </table></div>

    @if (pagoDe(); as e) {
      <app-modal [titulo]="'Registrar pago · ' + (e.nombre || e.email)" (cerrar)="pagoDe.set(null)">
        <div class="form-grid">
          <div class="campo"><label>Plan</label>
            <select [(ngModel)]="pg.planId" (ngModelChange)="recalcular()">
              @for (p of planesPago(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }} — {{ dinero(p.precio_mensual) }}/mes</option> }
            </select></div>
          <div class="campo"><label>Meses</label><input type="number" min="1" max="24" [(ngModel)]="pg.meses" (ngModelChange)="recalcular()" /></div>
        </div>
        <div class="form-grid">
          <div class="campo"><label>Monto recibido ($)</label><input type="number" step="0.01" [(ngModel)]="pg.monto" /></div>
          <div class="campo"><label>Método</label>
            <select [(ngModel)]="pg.metodo">@for (m of metodos; track m) { <option>{{ m }}</option> }</select></div>
        </div>
        <div class="campo"><label>Referencia / comprobante</label><input [(ngModel)]="pg.referencia" placeholder="Ej. # de transferencia" /></div>
        <div class="nota-info">El período empieza al día siguiente del vencimiento actual (o hoy, si ya venció) y la suscripción queda <b>activa</b>.</div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="pagoDe.set(null)">Cancelar</button>
          <button class="btn btn-primario" (click)="registrarPago(e)" [disabled]="guardando()">Registrar y activar</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class Admin implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);
  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;
  protected readonly metodos = ['Transferencia', 'Efectivo', 'Tarjeta', 'Otro'];

  protected readonly lista = signal<Entrenador[]>([]);
  protected readonly busqueda = signal('');
  protected readonly guardando = signal(false);
  protected readonly planesPago = computed(() => this.auth.planes().filter((p) => p.codigo !== 'prueba'));

  protected readonly filtrados = computed(() => {
    const q = normalizar(this.busqueda());
    return this.lista().filter((e) => !q || normalizar(e.nombre + ' ' + e.negocio + ' ' + e.email).includes(q));
  });

  protected readonly conteo = computed(() => {
    let activas = 0, prueba = 0, vencidas = 0, mrr = 0;
    this.lista().forEach((e) => {
      const s = e.suscripciones;
      if (!s) return;
      if (!this.vigente(s)) vencidas++;
      else if (s.estado === 'prueba') prueba++;
      else {
        activas++;
        mrr += Number(this.auth.planes().find((p) => p.id === s.plan_id)?.precio_mensual ?? 0);
      }
    });
    return { activas, prueba, vencidas, mrr };
  });

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await supabase.from('perfiles').select('*, suscripciones(*)').order('created_at', { ascending: false });
    if (error) return this.ui.error(error);
    this.lista.set((data as Entrenador[]) ?? []);
  }

  private vigente(s: Suscripcion) {
    return (s.estado === 'prueba' || s.estado === 'activa') && (diasDesde(s.vence_el) ?? 0) <= 0;
  }
  estado(s: Suscripcion | null) {
    if (!s) return '—';
    if (s.estado === 'cancelada') return 'Cancelada';
    if (!this.vigente(s)) return 'Vencida';
    return s.estado === 'prueba' ? 'Prueba' : 'Activa';
  }
  chipEstado(s: Suscripcion | null) {
    const e = this.estado(s);
    return e === 'Activa' ? 'chip-verde' : e === 'Prueba' ? 'chip-ambar' : e === 'Vencida' ? 'chip-rojo' : 'chip-gris';
  }
  nombrePlan(id?: number) {
    return this.auth.planes().find((p) => p.id === id)?.nombre ?? '—';
  }

  /* ---------- Pago manual ---------- */
  protected readonly pagoDe = signal<Entrenador | null>(null);
  protected pg = { planId: 0, meses: 1, monto: 0, metodo: 'Transferencia', referencia: '' };

  abrirPago(e: Entrenador) {
    const actual = this.planesPago().find((p) => p.id === e.suscripciones?.plan_id) ?? this.planesPago()[0];
    this.pg = { planId: actual?.id ?? 0, meses: 1, monto: 0, metodo: 'Transferencia', referencia: '' };
    this.recalcular();
    this.pagoDe.set(e);
  }
  recalcular() {
    const p = this.planesPago().find((x) => x.id === Number(this.pg.planId));
    this.pg.monto = Number(((p?.precio_mensual ?? 0) * (Number(this.pg.meses) || 1)).toFixed(2));
  }
  async registrarPago(e: Entrenador) {
    this.guardando.set(true);
    const { error } = await supabase.rpc('admin_registrar_pago_suscripcion', {
      p_trainer_id: e.id,
      p_plan_id: Number(this.pg.planId),
      p_meses: Number(this.pg.meses) || 1,
      p_monto: Number(this.pg.monto) || 0,
      p_metodo: this.pg.metodo,
      p_referencia: this.pg.referencia.trim(),
    });
    this.guardando.set(false);
    if (error) return this.ui.error(error);
    this.pagoDe.set(null);
    this.ui.toast('Pago registrado y plan activado ✓');
    await this.cargar();
    if (e.id === this.auth.perfil()?.id) await this.auth.cargarCuenta();
  }

  async extenderPrueba(e: Entrenador) {
    const s = e.suscripciones;
    if (!s) return;
    const base = (diasDesde(s.vence_el) ?? 0) > 0 ? hoyISO() : s.vence_el;
    const { error } = await supabase
      .from('suscripciones')
      .update({ vence_el: sumarDias(base, 7), estado: s.estado === 'cancelada' || s.estado === 'vencida' ? 'prueba' : s.estado, updated_at: new Date().toISOString() })
      .eq('trainer_id', e.id);
    if (error) return this.ui.error(error);
    this.ui.toast('Se sumaron 7 días ✓');
    await this.cargar();
  }

  async cancelar(e: Entrenador) {
    const ok = await this.ui.confirmar('Cancelar suscripción', `<b>${esc(e.nombre || e.email)}</b> podrá ver sus datos pero no guardar cambios.`);
    if (!ok) return;
    const { error } = await supabase.from('suscripciones').update({ estado: 'cancelada', updated_at: new Date().toISOString() }).eq('trainer_id', e.id);
    if (error) return this.ui.error(error);
    this.ui.toast('Suscripción cancelada');
    await this.cargar();
  }
}

