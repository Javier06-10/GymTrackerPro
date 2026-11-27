import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { leerTodo } from '../../core/leer-todo';
import { PagoSuscripcion, Perfil, Plan, Suscripcion } from '../../core/modelos';
import { supabase } from '../../core/supabase';
import { UiService } from '../../core/ui.service';
import { diasDesde, esc, fmtDinero, fmtFecha, hoyISO, normalizar, sumarDias } from '../../core/util';
import { Modal } from '../../shared/modal';
import { Icono } from '../../shared/icono';
import { AvatarIniciales } from '../../shared/avatar-iniciales';

type Entrenador = Perfil & { created_at: string; suscripciones: Suscripcion | null };
type Filtro = 'todos' | 'Activa' | 'Prueba' | 'Vencida';
type EstadoSus = Suscripcion['estado'];

/** Suma meses a una fecha ISO (31 ene + 1 mes = 28/29 feb). */
function sumarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  const fin = new Date(Date.UTC(a, m - 1 + meses + 1, 0)).getUTCDate();
  return new Date(Date.UTC(a, m - 1 + meses, Math.min(d, fin))).toISOString().slice(0, 10);
}

/** Código interno del plan a partir del nombre ("Pro Plus" → "pro-plus"). */
function codigoDe(nombre: string): string {
  return normalizar(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'plan';
}

/** Administración del SaaS: entrenadores, asignación de planes, pagos manuales y catálogo de planes. */
@Component({
  selector: 'app-admin',
  imports: [FormsModule, Modal, Icono, AvatarIniciales],
  template: `
    <section class="cab-pagina">
      <div class="cab-ico"><app-icono nombre="escudo" [tam]="24" /></div>
      <div class="cab-texto">
        <h1>Administración</h1>
        <p>Entrenadores, planes asignados, pagos manuales y catálogo de planes.</p>
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

    <div class="segmentado admin-vistas" role="tablist">
      <button role="tab" [class.activo]="vista() === 'entrenadores'" (click)="vista.set('entrenadores')"><app-icono nombre="usuarios" [tam]="15" /> Entrenadores</button>
      <button role="tab" [class.activo]="vista() === 'planes'" (click)="vista.set('planes')"><app-icono nombre="tarjeta" [tam]="15" /> Planes</button>
    </div>

    @if (vista() === 'entrenadores') {
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
              <button class="btn btn-suave btn-mini" (click)="abrirAsignar(e)" title="Cambiar plan, estado o vencimiento sin registrar pago"><app-icono nombre="engranaje" [tam]="15" /> Gestionar plan</button>
            </div>
          </div>
        } @empty {
          <div class="vacio" style="padding:30px;"><p>{{ cargado() ? 'No hay entrenadores con ese filtro.' : 'Cargando entrenadores…' }}</p></div>
        }
      </div>
    } @else {
      <div class="cab-lista-planes">
        <p>Lo que cambies aquí lo ven los entrenadores al instante en <b>Mi cuenta → Planes</b>. Un plan en uso no se borra: se desactiva y deja de ofrecerse, pero quien ya lo tiene lo conserva.</p>
        <button class="btn btn-primario" (click)="abrirPlan(null)"><app-icono nombre="mas" [tam]="15" /> Nuevo plan</button>
      </div>
      <div class="lista-planes-admin">
        @for (p of auth.planes(); track p.id) {
          <div class="fila-plan" [class.inactivo]="!p.activo">
            <div class="fp-info">
              <div class="fe-nombre">
                {{ p.nombre }}
                @if (p.codigo === 'prueba') { <span class="chip chip-ambar">Prueba gratis</span> }
                @if (p.destacado) { <span class="chip chip-acero"><app-icono nombre="estrella" [tam]="11" /> Destacado</span> }
                @if (!p.activo) { <span class="chip chip-gris">Desactivado</span> }
              </div>
              <div class="fe-sub">{{ p.max_atletas ? 'Hasta ' + p.max_atletas + ' atletas' : 'Atletas ilimitados' }}{{ p.descripcion ? ' · ' + p.descripcion : '' }}</div>
            </div>
            <div class="fp-precio">{{ dinero(p.precio_mensual) }}<small> / mes</small></div>
            <div class="fp-uso"><b>{{ usoPlan(p.id) }}</b> entrenador{{ usoPlan(p.id) === 1 ? '' : 'es' }}</div>
            <div class="fe-acciones">
              <button class="btn btn-suave btn-mini" (click)="abrirPlan(p)"><app-icono nombre="editar" [tam]="14" /> Editar</button>
              @if (p.codigo !== 'prueba') {
                <button class="btn btn-fantasma btn-mini" (click)="alternarActivo(p)">{{ p.activo ? 'Desactivar' : 'Activar' }}</button>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Registrar pago -->
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

    <!-- Gestionar plan de un entrenador (sin pago) -->
    @if (asignarA(); as e) {
      <app-modal [titulo]="'Gestionar plan · ' + (e.nombre || e.email)" (cerrar)="asignarA.set(null)" ancho="560px">
        <div class="form-grid">
          <div class="campo"><label>Plan</label>
            <select [(ngModel)]="asg.planId">
              @for (p of planesAsignables(e); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}{{ p.activo ? '' : ' (desactivado)' }} — {{ p.max_atletas ? p.max_atletas + ' atletas' : 'ilimitado' }}</option> }
            </select></div>
          <div class="campo"><label>Estado</label>
            <select [(ngModel)]="asg.estado">
              @for (o of estados; track o.v) { <option [ngValue]="o.v">{{ o.t }}</option> }
            </select></div>
        </div>
        <div class="campo"><label>Vence el</label>
          <input type="date" [(ngModel)]="asg.vence" />
          <div class="atajos-fecha">
            <button type="button" class="chip-filtro" (click)="sumar('d', 7)">+7 días</button>
            <button type="button" class="chip-filtro" (click)="sumar('m', 1)">+1 mes</button>
            <button type="button" class="chip-filtro" (click)="sumar('m', 3)">+3 meses</button>
            <button type="button" class="chip-filtro" (click)="sumar('m', 12)">+1 año</button>
          </div>
        </div>
        @if (resumenAsignar(); as r) { <div class="nota-info" [class.aviso-rojo]="r.bloquea" [innerHTML]="r.texto"></div> }

        @if (historial().length) {
          <div class="titulo-mini">Pagos registrados</div>
          <div class="tabla-scroll"><table class="tabla-compacta">
            <thead><tr><th>Período</th><th>Plan</th><th>Monto</th><th>Método</th></tr></thead>
            <tbody>
              @for (h of historial(); track h.id) {
                <tr><td>{{ fecha(h.periodo_desde) }} – {{ fecha(h.periodo_hasta) }}</td><td>{{ nombrePlan(h.plan_id) }}</td><td>{{ dinero(h.monto) }}</td><td>{{ h.metodo }}</td></tr>
              }
            </tbody>
          </table></div>
        }
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="asignarA.set(null)">Cancelar</button>
          <button class="btn btn-primario" (click)="guardarAsignacion(e)" [disabled]="guardando() || !asg.vence"><app-icono nombre="guardar" [tam]="15" /> Guardar cambios</button>
        </ng-container>
      </app-modal>
    }

    <!-- Crear / editar plan del catálogo -->
    @if (planEdit(); as pe) {
      <app-modal [titulo]="pe.id ? 'Editar plan · ' + pe.nombreOriginal : 'Nuevo plan'" (cerrar)="planEdit.set(null)">
        <div class="campo"><label>Nombre</label><input [(ngModel)]="pe.nombre" maxlength="40" placeholder="Ej. Pro Plus" /></div>
        <div class="form-grid">
          <div class="campo"><label>Precio mensual ($)</label><input type="number" min="0" step="0.01" [(ngModel)]="pe.precio" /></div>
          <div class="campo"><label>Máximo de atletas</label><input type="number" min="1" [(ngModel)]="pe.max" placeholder="Vacío = ilimitado" /></div>
        </div>
        <div class="campo"><label>Descripción corta (opcional)</label><input [(ngModel)]="pe.descripcion" maxlength="200" placeholder="Ej. Ideal para gimnasios con varios entrenadores" /></div>
        <label class="casilla-linea"><input type="checkbox" [(ngModel)]="pe.destacado" /> <span>Destacar como <b>“Más popular”</b></span></label>
        @if (pe.codigo !== 'prueba') {
          <label class="casilla-linea"><input type="checkbox" [(ngModel)]="pe.activo" /> <span>Disponible para elegir en Mi cuenta</span></label>
        }
        @if (pe.id && usoPlan(pe.id)) {
          <div class="nota-info">{{ usoPlan(pe.id) }} entrenador{{ usoPlan(pe.id) === 1 ? ' tiene' : 'es tienen' }} este plan: el nuevo cupo se les aplica al instante; el precio nuevo, a partir de su próximo pago.</div>
        }
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="planEdit.set(null)">Cancelar</button>
          <button class="btn btn-primario" (click)="guardarPlan(pe)" [disabled]="guardando() || !pe.nombre.trim()"><app-icono nombre="guardar" [tam]="15" /> {{ pe.id ? 'Guardar' : 'Crear plan' }}</button>
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
  protected readonly estados: { v: EstadoSus; t: string }[] = [
    { v: 'activa', t: 'Activa (pagada)' }, { v: 'prueba', t: 'Prueba gratis' }, { v: 'vencida', t: 'Vencida' }, { v: 'cancelada', t: 'Cancelada' },
  ];

  protected readonly vista = signal<'entrenadores' | 'planes'>('entrenadores');
  protected readonly lista = signal<Entrenador[]>([]);
  protected readonly busqueda = signal('');
  protected readonly cargado = signal(false);
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly filtros: { v: Filtro; t: string }[] = [
    { v: 'todos', t: 'Todos' }, { v: 'Activa', t: 'Activas' }, { v: 'Prueba', t: 'En prueba' }, { v: 'Vencida', t: 'Vencidas' },
  ];
  protected readonly guardando = signal(false);
  protected readonly planesPago = computed(() => this.auth.planes().filter((p) => p.codigo !== 'prueba' && p.activo));

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

  /** Entrenadores por plan (para el catálogo). */
  private readonly usoPorPlan = computed(() => {
    const m = new Map<number, number>();
    this.lista().forEach((e) => e.suscripciones && m.set(e.suscripciones.plan_id, (m.get(e.suscripciones.plan_id) ?? 0) + 1));
    return m;
  });
  usoPlan(id: number) {
    return this.usoPorPlan().get(id) ?? 0;
  }

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    // Paginado: con más de 1.000 entrenadores Supabase cortaría la lista sin avisar.
    let perfiles: Entrenador[], correos: { trainer_id: string; confirmado: boolean }[];
    try {
      [perfiles, correos] = await Promise.all([
        leerTodo<Entrenador>((d, h) => supabase.from('perfiles').select('*, suscripciones(*)').order('created_at', { ascending: false }).order('id').range(d, h)),
        // el estado de correo es un extra: si falla, la lista se muestra igual (como antes)
        leerTodo<{ trainer_id: string; confirmado: boolean }>((d, h) => supabase.rpc('admin_estado_correos').order('trainer_id').range(d, h)).catch(() => []),
        this.auth.cargarPlanes(),
      ]);
    } catch (e) {
      return this.ui.error(e);
    }
    this.lista.set(perfiles);
    const pendientes = correos.filter((c) => !c.confirmado);
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

  /* ---------- Gestionar plan de un entrenador (cortesía, cambio de plan, fechas) ---------- */
  protected readonly asignarA = signal<Entrenador | null>(null);
  protected readonly historial = signal<PagoSuscripcion[]>([]);
  protected asg: { planId: number; estado: EstadoSus; vence: string } = { planId: 0, estado: 'activa', vence: hoyISO() };
  private readonly asCambio = signal(0); // fuerza recalcular el resumen al tocar los campos del modal

  planesAsignables(e: Entrenador) {
    return this.auth.planes().filter((p) => p.activo || p.id === e.suscripciones?.plan_id);
  }

  async abrirAsignar(e: Entrenador) {
    const s = e.suscripciones;
    this.asg = { planId: s?.plan_id ?? this.planesPago()[0]?.id ?? 0, estado: s?.estado ?? 'activa', vence: s?.vence_el ?? hoyISO() };
    this.historial.set([]);
    this.asignarA.set(e);
    const { data } = await supabase.from('pagos_suscripcion').select('*').eq('trainer_id', e.id).order('periodo_desde', { ascending: false }).limit(12);
    this.historial.set((data as PagoSuscripcion[]) ?? []);
  }

  /** Suma tiempo desde el vencimiento (o desde hoy si ya venció) y, si estaba vencida/cancelada, la reactiva. */
  sumar(tipo: 'd' | 'm', n: number) {
    const base = this.asg.vence && this.asg.vence >= hoyISO() ? this.asg.vence : hoyISO();
    this.asg.vence = tipo === 'd' ? sumarDias(base, n) : sumarMeses(base, n);
    if (this.asg.estado === 'vencida' || this.asg.estado === 'cancelada') {
      const plan = this.auth.planes().find((p) => p.id === Number(this.asg.planId));
      this.asg.estado = plan?.codigo === 'prueba' ? 'prueba' : 'activa';
    }
    this.asCambio.update((v) => v + 1);
  }

  resumenAsignar() {
    this.asCambio();
    const v = this.asg.vence;
    if (!v) return { bloquea: true, texto: 'Elige la fecha de vencimiento.' };
    const plan = this.auth.planes().find((p) => p.id === Number(this.asg.planId));
    const accede = (this.asg.estado === 'activa' || this.asg.estado === 'prueba') && v >= hoyISO();
    const dias = -(diasDesde(v) ?? 0);
    return accede
      ? { bloquea: false, texto: `Tendrá acceso completo con <b>${esc(plan?.nombre ?? '')}</b> hasta el <b>${fmtFecha(v)}</b> (${dias} día${dias === 1 ? '' : 's'}). No se registra ningún pago.` }
      : { bloquea: true, texto: 'Con este estado o fecha <b>no podrá guardar cambios</b>: solo verá sus datos.' };
  }

  async guardarAsignacion(e: Entrenador) {
    this.guardando.set(true);
    const { error } = await supabase
      .from('suscripciones')
      .update({ plan_id: Number(this.asg.planId), estado: this.asg.estado, vence_el: this.asg.vence, updated_at: new Date().toISOString() })
      .eq('trainer_id', e.id);
    this.guardando.set(false);
    if (error) return this.ui.error(error);
    this.asignarA.set(null);
    this.ui.toast('Plan actualizado ✓');
    await this.cargar();
    if (e.id === this.auth.perfil()?.id) await this.auth.cargarCuenta();
  }

  /* ---------- Catálogo de planes ---------- */
  protected readonly planEdit = signal<{
    id: number | null; codigo: string; nombreOriginal: string; nombre: string; precio: number; max: number | null;
    descripcion: string; destacado: boolean; activo: boolean;
  } | null>(null);

  abrirPlan(p: Plan | null) {
    this.planEdit.set(
      p
        ? { id: p.id, codigo: p.codigo, nombreOriginal: p.nombre, nombre: p.nombre, precio: Number(p.precio_mensual), max: p.max_atletas, descripcion: p.descripcion ?? '', destacado: p.destacado, activo: p.activo }
        : { id: null, codigo: '', nombreOriginal: '', nombre: '', precio: 0, max: null, descripcion: '', destacado: false, activo: true },
    );
  }

  async guardarPlan(pe: NonNullable<ReturnType<typeof this.planEdit>>) {
    const max = pe.max === null || (pe.max as unknown) === '' || Number(pe.max) <= 0 ? null : Math.round(Number(pe.max));
    const precio = Math.max(0, Number(pe.precio) || 0);
    const datos = { nombre: pe.nombre.trim(), precio_mensual: precio, max_atletas: max, descripcion: pe.descripcion.trim(), destacado: pe.destacado, activo: pe.codigo === 'prueba' ? true : pe.activo };
    this.guardando.set(true);
    let error;
    if (pe.id) {
      ({ error } = await supabase.from('planes').update(datos).eq('id', pe.id));
    } else {
      const usados = new Set(this.auth.planes().map((p) => p.codigo));
      let codigo = codigoDe(datos.nombre);
      for (let i = 2; usados.has(codigo); i++) codigo = codigoDe(datos.nombre) + '-' + i;
      ({ error } = await supabase.from('planes').insert({ ...datos, codigo }));
    }
    // Un solo plan destacado a la vez
    if (!error && pe.destacado) {
      const otros = this.auth.planes().filter((p) => p.destacado && p.id !== pe.id).map((p) => p.id);
      if (otros.length) ({ error } = await supabase.from('planes').update({ destacado: false }).in('id', otros));
    }
    this.guardando.set(false);
    if (error) return this.ui.error(error);
    this.planEdit.set(null);
    this.ui.toast(pe.id ? 'Plan actualizado ✓' : 'Plan creado ✓');
    await this.auth.cargarPlanes();
  }

  async alternarActivo(p: Plan) {
    if (p.activo && this.usoPlan(p.id)) {
      const ok = await this.ui.confirmar(
        'Desactivar plan',
        `<b>${esc(p.nombre)}</b> dejará de ofrecerse. Los ${this.usoPlan(p.id)} entrenador(es) que lo tienen lo conservan hasta que les cambies el plan.`,
        'Desactivar',
      );
      if (!ok) return;
    }
    const { error } = await supabase.from('planes').update({ activo: !p.activo }).eq('id', p.id);
    if (error) return this.ui.error(error);
    this.ui.toast(p.activo ? 'Plan desactivado' : 'Plan activado ✓');
    await this.auth.cargarPlanes();
  }
}
