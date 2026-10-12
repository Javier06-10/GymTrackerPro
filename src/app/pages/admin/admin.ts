import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Perfil, Suscripcion } from '../../core/modelos';
import { supabase } from '../../core/supabase';
import { UiService } from '../../core/ui.service';
import { diasDesde, esc, fmtDinero, fmtFecha, hoyISO, normalizar, sumarDias } from '../../core/util';
import { Modal } from '../../shared/modal';
import { Icono } from '../../shared/icono';
import { AvatarIniciales } from '../../shared/avatar-iniciales';

type Entrenador = Perfil & { created_at: string; suscripciones: Suscripcion | null };
type Filtro = 'todos' | 'Activa' | 'Prueba' | 'Vencida';

/** Administración del SaaS: entrenadores, estado de suscripción y registro de pagos manuales. */
@Component({
  selector: 'app-admin',
  imports: [FormsModule, Modal, Icono, AvatarIniciales],
  template: `
    <section class="cab-pagina">
      <div class="cab-ico"><app-icono nombre="escudo" [tam]="24" /></div>
      <div class="cab-texto">
        <h1>Administración</h1>
        <p>Entrenadores suscritos, estado de cada plan y registro de pagos manuales.</p>
      </div>
      <div class="cab-acciones">
        <button class="btn btn-suave" (click)="cargar()"><app-icono nombre="recargar" [tam]="15" /> Recargar</button>
      </div>
    </section>

    <div class="grid-metricas">
      <div class="metrica">
        <div class="etiqueta"><span class="ico"><app-icono nombre="usuarios" /></span> Entrenadores</div>
        <div class="valor">{{ lista().length }}</div>
        <div class="sub">Cuentas registradas</div>
      </div>
      <div class="metrica m-verde">
        <div class="etiqueta"><span class="ico"><app-icono nombre="dinero" /></span> Ingreso mensual</div>
        <div class="valor">{{ dinero(conteo().mrr) }}</div>
        <div class="sub">{{ conteo().activas }} suscripci{{ conteo().activas === 1 ? 'ón activa' : 'ones activas' }}</div>
      </div>
      <div class="metrica m-acero">
        <div class="etiqueta"><span class="ico"><app-icono nombre="regalo" /></span> En prueba</div>
        <div class="valor">{{ conteo().prueba }}</div>
        <div class="sub">Clientes por convertir</div>
      </div>
      <div class="metrica m-rojo">
        <div class="etiqueta"><span class="ico"><app-icono nombre="alerta" /></span> Vencidas</div>
        <div class="valor">{{ conteo().vencidas }}</div>
        <div class="sub">Sin acceso para guardar</div>
      </div>
    </div>

    <div class="barra-busqueda">
      <div class="campo-buscar"><span class="lupa"><app-icono nombre="lupa" [tam]="16" /></span>
        <input type="text" placeholder="Buscar por nombre, negocio o correo..." [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" /></div>
      <div class="filtros-grupo" style="margin:0;">
        @for (f of filtros; track f.v) {
          <div class="chip-filtro" [class.activo]="filtro() === f.v" (click)="filtro.set(f.v)">{{ f.t }}</div>
        }
      </div>
    </div>

    <div class="lista-entrenadores">
      @for (e of filtrados(); track e.id) {
        @let s = e.suscripciones;
        <div class="fila-entrenador">
          <app-avatar-iniciales [nombre]="e.nombre || e.email" genero="hombre" [tam]="42" />
          <div class="fe-info">
            <div class="fe-nombre">
              {{ e.nombre || '—' }}
              @if (e.rol === 'admin') { <span class="chip chip-acero">Admin</span> }
              @if (sinConfirmar(e.id)) { <span class="chip chip-rojo" title="No ha confirmado su correo: no puede entrar"><app-icono nombre="alerta" [tam]="12" /> Correo sin confirmar</span> }
            </div>
            <div class="fe-sub">{{ e.negocio ? e.negocio + ' · ' : '' }}{{ e.email }}</div>
            @if (sinConfirmar(e.id)) {
              <button class="btn btn-suave btn-mini fe-confirmar" (click)="confirmarCorreo(e)"><app-icono nombre="check" [tam]="14" /> Confirmar correo y dar acceso</button>
            }
          </div>
          <div class="fe-plan">
            <span [class]="'chip ' + chipEstado(s)">{{ estado(s) }}</span>
            <div class="fe-sub">{{ nombrePlan(s?.plan_id) }} · vence {{ fecha(s?.vence_el) }}</div>
          </div>
          <div class="fe-acciones">
            <button class="btn btn-primario btn-mini" (click)="abrirPago(e)"><app-icono nombre="dinero" [tam]="15" /> Registrar pago</button>
            <button class="btn btn-suave btn-mini" (click)="extenderPrueba(e)" title="Sumar 7 días">+7 días</button>
            @if (s?.estado !== 'cancelada') {
              <button class="btn-x" title="Cancelar suscripción" (click)="cancelar(e)"><app-icono nombre="prohibido" [tam]="16" /></button>
            }
          </div>
        </div>
      } @empty {
        <div class="vacio" style="padding:30px;"><p>{{ cargado() ? 'No hay entrenadores con ese filtro.' : 'Cargando entrenadores…' }}</p></div>
      }
    </div>

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
  protected readonly cargado = signal(false);
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly filtros: { v: Filtro; t: string }[] = [
    { v: 'todos', t: 'Todos' }, { v: 'Activa', t: 'Activas' }, { v: 'Prueba', t: 'En prueba' }, { v: 'Vencida', t: 'Vencidas' },
  ];
  protected readonly guardando = signal(false);
  protected readonly planesPago = computed(() => this.auth.planes().filter((p) => p.codigo !== 'prueba'));

  protected readonly filtrados = computed(() => {
    const q = normalizar(this.busqueda());
    const f = this.filtro();
    return this.lista().filter(
      (e) => (!q || normalizar(e.nombre + ' ' + e.negocio + ' ' + e.email).includes(q)) && (f === 'todos' || this.estado(e.suscripciones) === f),
    );
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
    const [perfiles, correos] = await Promise.all([
      supabase.from('perfiles').select('*, suscripciones(*)').order('created_at', { ascending: false }),
      supabase.rpc('admin_estado_correos'),
    ]);
    if (perfiles.error) return this.ui.error(perfiles.error);
    this.lista.set((perfiles.data as Entrenador[]) ?? []);
    const pendientes = ((correos.data as { trainer_id: string; confirmado: boolean }[]) ?? []).filter((c) => !c.confirmado);
    this.pendientes.set(new Set(pendientes.map((c) => c.trainer_id)));
    this.cargado.set(true);
  }

  /* ---------- Correos sin confirmar ---------- */
  protected readonly pendientes = signal<Set<string>>(new Set());
  protected sinConfirmar(id: string) {
    return this.pendientes().has(id);
  }
  async confirmarCorreo(e: Entrenador) {
    const ok = await this.ui.confirmar(
      'Confirmar correo',
      `<b>${esc(e.nombre || e.email)}</b> podrá entrar con su correo y contraseña sin usar el enlace de confirmación.`,
      'Confirmar y dar acceso',
    );
    if (!ok) return;
    const { error } = await supabase.rpc('admin_confirmar_correo', { p_trainer_id: e.id });
    if (error) return this.ui.error(error);
    this.ui.toast('Correo confirmado ✓ Ya puede entrar');
    await this.cargar();
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

