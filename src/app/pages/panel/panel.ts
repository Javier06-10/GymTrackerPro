import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { OBJETIVOS, medicionPendiente, nombreObjetivo, pagoVencido, ultimaMedida } from '../../core/dominio';
import { Atleta } from '../../core/modelos';
import { mesesReporte } from '../../core/pdf';
import { PdfService } from '../../core/pdf.service';
import { UiService } from '../../core/ui.service';
import { Modal } from '../../shared/modal';
import { abrirWhatsApp, primerNombre } from '../../core/whatsapp';
import { MESES_CORTOS, MESES_ES, diasDesde, fmtDinero, fmtFecha, hoyISO, isoDe, normalizar, proximoCumple } from '../../core/util';
import { GraficaBarras } from '../../shared/graficas/grafica-barras';
import { AvatarIniciales } from '../../shared/avatar-iniciales';
import { GruposModal } from './grupos-modal';
import { Icono } from '../../shared/icono';

/** Dashboard — balance global del entrenador (portado de renderDashboard). */
@Component({
  selector: 'app-panel',
  imports: [FormsModule, AvatarIniciales, GruposModal, Modal, GraficaBarras, Icono],
  template: `
    <section class="hero-panel">
      <div class="texto">
        <div class="hero-fecha">{{ fechaLarga }}</div>
        <h1>{{ saludo }}{{ primerNombreEntrenador() ? ', ' + primerNombreEntrenador() : '' }}</h1>
        <p>{{ resumenHoy() }}</p>
        <div class="hero-acciones">
          <button class="btn btn-primario" (click)="ui.formAtleta.set({ id: null })" [disabled]="!auth.vigente()">
            <app-icono nombre="mas" [tam]="16" /> Nuevo atleta
          </button>
          <button class="btn btn-suave" (click)="mesReporte = meses[0].valor; reporteAbierto.set(true)"><app-icono nombre="grafico" [tam]="16" /> Reporte del mes</button>
          <button class="btn btn-fantasma" (click)="irManual()"><app-icono nombre="libro" [tam]="16" /> Manual</button>
        </div>
      </div>
      <div class="hero-arte" aria-hidden="true">
        <!-- Barra con discos y pulso: ilustración decorativa -->
        <svg viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 92 H70 L82 70 L96 108 L110 52 L124 92 H234" fill="none" stroke="rgba(255,154,61,.55)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
          <rect x="30" y="36" width="180" height="6" rx="3" fill="#8a90a0"/>
          <rect x="44" y="14" width="14" height="50" rx="3" fill="#2a2e38" stroke="#eef0f4" stroke-width="1.6"/>
          <rect x="60" y="20" width="10" height="38" rx="3" fill="#d0731f" stroke="#eef0f4" stroke-width="1.6"/>
          <rect x="182" y="14" width="14" height="50" rx="3" fill="#2a2e38" stroke="#eef0f4" stroke-width="1.6"/>
          <rect x="170" y="20" width="10" height="38" rx="3" fill="#d0731f" stroke="#eef0f4" stroke-width="1.6"/>
          <rect x="22" y="33" width="10" height="12" rx="2" fill="#6f6d6b"/><rect x="208" y="33" width="10" height="12" rx="2" fill="#6f6d6b"/>
        </svg>
      </div>
    </section>

    <div class="grid-metricas">
      <div class="metrica m-verde">
        <div class="etiqueta"><span class="ico"><app-icono nombre="dinero" /></span> Ingresos · 30 días</div>
        <div class="valor">{{ dinero(ingresos30()) }}</div>
        <div class="sub">Suma de pagos registrados</div>
      </div>
      <div class="metrica m-acero">
        <div class="etiqueta"><span class="ico"><app-icono nombre="usuarios" /></span> Atletas activos</div>
        <div class="valor">{{ activos() }}{{ limite() ? ' / ' + limite() : '' }}</div>
        <div class="sub">{{ inactivos() }} inactivo{{ inactivos() === 1 ? '' : 's' }}{{ limite() ? ' · límite de tu plan' : '' }}</div>
      </div>
      <div class="metrica m-rojo">
        <div class="etiqueta"><span class="ico"><app-icono nombre="alerta" /></span> Por cobrar</div>
        <div class="valor">{{ vencidos().length }}</div>
        <div class="sub">{{ dinero(porCobrar()) }} pendiente</div>
      </div>
      <div class="metrica">
        <div class="etiqueta"><span class="ico"><app-icono nombre="actividad" /></span> Asistencia · 8 semanas</div>
        <div class="valor">{{ pctAsistencia8() === null ? '—' : pctAsistencia8() + '%' }}</div>
        <div class="sub">Entrenos vs. faltas marcados</div>
      </div>
    </div>

    @if (datos.atletas().length) {
      <div class="grid-graficas" style="margin-bottom:6px;">
        <div class="tarjeta">
          <div class="grafica-cab">
            <span class="t"><app-icono nombre="dinero" [tam]="17" /> Ingresos por mes</span>
            <span class="s">Últimos 6 meses · {{ dinero(totalSeisMeses()) }}</span>
          </div>
          <app-grafica-barras [barras]="ingresosMes()" titulo="Ingresos por mes, últimos 6 meses" color="var(--serie-ambar)"
            [formato]="dinero" />
          <details class="ver-datos"><summary>Ver datos</summary>
            <div class="tabla-scroll"><table>
              <tr><th>Mes</th><th>Ingresos</th><th>Pagos</th></tr>
              @for (b of ingresosMes(); track b.etiqueta) { <tr><td>{{ b.detalle }}</td><td>{{ dinero(b.valor) }}</td><td>{{ b.pagos }}</td></tr> }
            </table></div>
          </details>
        </div>
        <div class="tarjeta">
          <div class="grafica-cab">
            <span class="t"><app-icono nombre="pesa" [tam]="17" /> Entrenamientos por semana</span>
            <span class="s">Últimas 8 semanas · asistencia {{ pctAsistencia8() === null ? '—' : pctAsistencia8() + '%' }}</span>
          </div>
          <app-grafica-barras [barras]="entrenosSemana()" titulo="Entrenamientos registrados por semana, últimas 8 semanas" color="var(--serie-azul)"
            [formato]="formatoEntrenos" />
          <details class="ver-datos"><summary>Ver datos</summary>
            <div class="tabla-scroll"><table>
              <tr><th>Semana</th><th>Entrenos</th><th>Faltas</th></tr>
              @for (b of entrenosSemana(); track b.etiqueta) { <tr><td>{{ b.detalle }}</td><td>{{ b.valor }}</td><td>{{ b.faltas }}</td></tr> }
            </table></div>
          </details>
        </div>
      </div>
    }

    @if (vencidos().length) {
      <div class="titulo-seccion"><app-icono nombre="campana" [tam]="16" /> Alertas de cobro</div>
      @for (a of vencidos(); track a.id) {
        <div class="alerta-cobro" (click)="ir(a.id, 'pagos')">
          <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" [tam]="38" />
          <div class="ac-texto">
            <div class="nombre">{{ a.nombre }}</div>
            <div class="dias">Vencido hace {{ dias(a.proximoPago) }} día{{ dias(a.proximoPago) === 1 ? '' : 's' }}</div>
          </div>
          <div class="monto">{{ dinero(a.tarifa) }}</div>
          @if (a.telefono) {
            <button class="btn-x" title="Recordar por WhatsApp" (click)="$event.stopPropagation(); recordarPago(a)"><app-icono nombre="chat" [tam]="17" /></button>
          }
        </div>
      }
    }

    @if (cumples().length) {
      <div class="titulo-seccion"><app-icono nombre="cumple" [tam]="16" /> Cumpleaños</div>
      @for (x of cumples(); track x.a.id) {
        <div class="alerta-cobro" style="border-color:rgba(255,154,61,.4);border-left-color:var(--ambar);" (click)="ir(x.a.id)">
          <div style="color:var(--ambar);display:inline-flex"><app-icono nombre="cumple" [tam]="24" /></div>
          <div class="ac-texto">
            <div class="nombre">{{ x.a.nombre }}</div>
            <div class="dias" style="color:var(--ambar);">
              @if (x.pc.dias === 0) { ¡Cumple HOY {{ x.pc.edadCumple }} años! }
              @else if (x.pc.dias === 1) { Cumple mañana {{ x.pc.edadCumple }} años }
              @else { Cumple {{ x.pc.edadCumple }} en {{ x.pc.dias }} días ({{ fecha(x.pc.fecha) }}) }
            </div>
          </div>
          @if (x.a.telefono && x.pc.dias === 0) {
            <button class="btn btn-suave btn-mini" (click)="$event.stopPropagation(); felicitar(x.a, x.pc.edadCumple)"><app-icono nombre="chat" [tam]="15" /> Felicitar</button>
          }
        </div>
      }
    }

    @if (pendMed().length) {
      <div class="titulo-seccion"><app-icono nombre="regla" [tam]="16" /> Mediciones pendientes</div>
      @for (a of pendMed(); track a.id) {
        <div class="alerta-cobro" style="border-color:rgba(91,141,184,.35);border-left-color:var(--acero);" (click)="ir(a.id, 'medidas')">
          <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" [tam]="38" />
          <div class="ac-texto">
            <div class="nombre">{{ a.nombre }}</div>
            <div class="dias" style="color:var(--acero);">Última medición hace {{ diasMed(a) }} días</div>
          </div>
        </div>
      }
    }

    <div class="titulo-seccion"><app-icono nombre="usuarios" [tam]="16" /> Mis atletas</div>

    @if (!datos.atletas().length) {
      <div class="vacio">
        <span class="ic"><app-icono nombre="pesa" [tam]="44" /></span>
        <h3>Aún no tienes atletas registrados</h3>
        <p>Agrega tu primer cliente para empezar a llevar su progreso físico, rutinas y pagos.</p>
        <button class="btn btn-primario" (click)="ui.formAtleta.set({ id: null })" [disabled]="!auth.vigente()"><app-icono nombre="mas" [tam]="16" /> Agregar primer atleta</button>
      </div>
    } @else {
      <div class="barra-busqueda">
        <div class="campo-buscar">
          <span class="lupa"><app-icono nombre="lupa" [tam]="16" /></span>
          <input type="text" placeholder="Buscar atleta por nombre..." [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" />
        </div>
        <button class="btn btn-suave" (click)="gruposAbierto.set(true)"><app-icono nombre="usuarios" [tam]="16" /> Grupos</button>
        <button class="btn btn-suave" (click)="mesReporte = meses[0].valor; reporteAbierto.set(true)"><app-icono nombre="grafico" [tam]="16" /> Reporte</button>
      </div>

      @if (datos.grupos().length) {
        <div class="filtros-grupo">
          <div class="chip-filtro" [class.activo]="filtroGrupo() === 'todos'" (click)="filtroGrupo.set('todos')">Todos ({{ datos.atletas().length }})</div>
          @for (g of datos.grupos(); track g.id) {
            <div class="chip-filtro" [class.activo]="filtroGrupo() === g.id" (click)="filtroGrupo.set(g.id)">{{ g.nombre }} ({{ contarGrupo(g.id) }})</div>
          }
          @if (sinGrupo()) {
            <div class="chip-filtro" [class.activo]="filtroGrupo() === 'singrupo'" (click)="filtroGrupo.set('singrupo')">Sin grupo ({{ sinGrupo() }})</div>
          }
        </div>
      }

      <div class="lista-atletas">
        @for (a of lista(); track a.id) {
          @let u = ultima(a);
          <div class="card-atleta" [class.inactivo]="!a.activo" [class.con-alerta]="vencido(a)" (click)="ir(a.id)">
            <div class="ca-cab">
              <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" />
              <div class="info">
                <div class="nombre">{{ a.nombre }}</div>
                <div class="detalle"><app-icono [nombre]="objetivoIc(a)" [tam]="13" /> {{ objetivoNombre(a.objetivo) }}</div>
              </div>
              <span class="ca-ir"><app-icono nombre="chevron" [tam]="15" /></span>
            </div>
            <div class="ca-stats">
              <div><span>Peso</span><b>{{ u ? u.peso + ' lb' : '—' }}</b></div>
              <div><span>Medido</span><b>{{ u ? fecha(u.fecha) : 'Nunca' }}</b></div>
              <div><span>Cobro</span><b [class.rojo]="vencido(a)">{{ a.proximoPago ? fecha(a.proximoPago) : '—' }}</b></div>
            </div>
            <div class="ca-chips">
              @if (a.activo) { <span class="chip chip-verde">Activo</span> } @else { <span class="chip chip-gris">Inactivo</span> }
              @if (a.grupoId) { <span class="chip chip-acero"><app-icono nombre="usuarios" [tam]="12" /> {{ datos.nombreGrupo(a.grupoId) }}</span> }
              @if (cumpleHoy(a)) { <span class="chip chip-ambar"><app-icono nombre="cumple" [tam]="12" /> ¡Hoy!</span> }
              @if (vencido(a)) { <span class="chip chip-rojo"><app-icono nombre="alerta" [tam]="12" /> Pago vencido</span> }
            </div>
          </div>
        } @empty {
          <div class="vacio" style="grid-column:1/-1;padding:30px;"><p>No se encontraron atletas con ese nombre.</p></div>
        }
      </div>
    }

    <div class="sello-seguridad">
      <app-icono nombre="escudo" />
      <span><b>Tus datos están protegidos:</b> conexión cifrada y cada entrenador solo puede ver su propia información.</span>
    </div>

    @if (reporteAbierto()) {
      <app-modal titulo="Reporte mensual del negocio" (cerrar)="reporteAbierto.set(false)">
        <p style="color:var(--texto-suave);font-size:13.5px;">
          La foto del negocio en una página: ingresos, cuentas por cobrar, atletas, asistencia y seguimiento del mes elegido.
        </p>
        <div class="campo"><label>Mes del reporte</label>
          <select [(ngModel)]="mesReporte">@for (m of meses; track m.valor) { <option [value]="m.valor">{{ m.etiqueta }}</option> }</select>
        </div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="reporteAbierto.set(false)">Cancelar</button>
          <button class="btn btn-primario" (click)="generarReporte()"><app-icono nombre="documento" [tam]="16" /> Generar PDF</button>
        </ng-container>
      </app-modal>
    }

    @if (gruposAbierto()) {
      <app-grupos-modal (cerrar)="gruposAbierto.set(false)" (eliminado)="alEliminarGrupo($event)" />
    }
  `,
})
export class Panel {
  protected readonly datos = inject(DatosService);
  protected readonly auth = inject(AuthService);
  protected readonly ui = inject(UiService);
  private readonly router = inject(Router);

  protected readonly busqueda = signal('');
  protected readonly filtroGrupo = signal('todos');
  protected readonly gruposAbierto = signal(false);

  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;
  protected readonly objetivoNombre = nombreObjetivo;
  protected objetivoIc(a: Atleta) {
    return OBJETIVOS[a.objetivo]?.ic ?? 'diana';
  }
  protected readonly ultima = ultimaMedida;
  protected readonly vencido = pagoVencido;
  protected dias(iso: string) { return diasDesde(iso) ?? 0; }
  protected diasMed(a: Atleta) { return medicionPendiente(a)?.dias ?? 0; }
  protected cumpleHoy(a: Atleta) { return proximoCumple(a.fechaNacimiento)?.dias === 0; }

  protected readonly activos = computed(() => this.datos.atletas().filter((a) => a.activo).length);
  protected readonly inactivos = computed(() => this.datos.atletas().length - this.activos());
  protected readonly limite = computed(() => this.auth.plan()?.max_atletas ?? null);

  protected readonly ingresos30 = computed(() => {
    let total = 0;
    this.datos.atletas().forEach((a) =>
      a.pagos.forEach((p) => {
        const d = diasDesde(p.fecha) ?? -1;
        if (d >= 0 && d <= 30) total += p.monto;
      }),
    );
    return total;
  });

  protected readonly vencidos = computed(() =>
    this.datos.atletas().filter(pagoVencido).sort((a, b) => (diasDesde(b.proximoPago) ?? 0) - (diasDesde(a.proximoPago) ?? 0)),
  );
  protected readonly porCobrar = computed(() => this.vencidos().reduce((s, a) => s + a.tarifa, 0));

  protected readonly cumples = computed(() =>
    this.datos.atletas()
      .map((a) => ({ a, pc: proximoCumple(a.fechaNacimiento) }))
      .filter((x): x is { a: Atleta; pc: NonNullable<ReturnType<typeof proximoCumple>> } => !!x.pc && x.pc.dias <= 7)
      .sort((x, y) => x.pc.dias - y.pc.dias),
  );

  protected readonly pendMed = computed(() => this.datos.atletas().filter((a) => a.activo && medicionPendiente(a)?.vencida));

  protected readonly sinGrupo = computed(() => this.datos.atletas().filter((a) => !a.grupoId).length);
  protected contarGrupo(id: string) { return this.datos.atletas().filter((a) => a.grupoId === id).length; }

  protected readonly lista = computed(() => {
    const q = normalizar(this.busqueda());
    const fg = this.filtroGrupo();
    return this.datos.atletas().filter((a) => {
      if (q && !normalizar(a.nombre).includes(q)) return false;
      if (fg === 'todos') return true;
      if (fg === 'singrupo') return !a.grupoId;
      return a.grupoId === fg;
    });
  });

  /* ---------- Cabecera de bienvenida ---------- */
  protected readonly saludo = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();
  protected readonly fechaLarga = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });
  protected readonly primerNombreEntrenador = computed(() => primerNombre(this.auth.perfil()?.nombre ?? ''));
  protected readonly resumenHoy = computed(() => {
    const n = this.activos();
    if (!this.datos.atletas().length) return 'Empieza agregando a tu primer atleta: medidas, rutinas, nutrición y cobros en un solo lugar.';
    const partes = [`${n} atleta${n === 1 ? '' : 's'} activo${n === 1 ? '' : 's'}`];
    const v = this.vencidos().length;
    partes.push(v ? `${v} cobro${v === 1 ? '' : 's'} pendiente${v === 1 ? '' : 's'}` : 'cobros al día');
    const m = this.pendMed().length;
    if (m) partes.push(`${m} medición${m === 1 ? '' : 'es'} por hacer`);
    const c = this.cumples().length;
    if (c) partes.push(`${c} cumpleaños esta semana`);
    return partes.join(' · ') + '.';
  });
  irManual() { this.router.navigateByUrl('/manual'); }

  /* ---------- Tendencias (gráficas) ---------- */
  protected readonly formatoEntrenos = (n: number) => `${n} entreno${n === 1 ? '' : 's'}`;

  protected readonly ingresosMes = computed(() => {
    const hoy = new Date(hoyISO() + 'T00:00:00');
    return Array.from({ length: 6 }, (_, k) => {
      const f = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - k), 1);
      const pref = f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0');
      let valor = 0, pagos = 0;
      this.datos.atletas().forEach((a) => a.pagos.forEach((p) => { if (p.fecha.startsWith(pref)) { valor += p.monto; pagos++; } }));
      return { etiqueta: MESES_CORTOS[f.getMonth()], valor, pagos, detalle: `${MESES_ES[f.getMonth()]} ${f.getFullYear()} · ${pagos} pago${pagos === 1 ? '' : 's'}` };
    });
  });
  protected readonly totalSeisMeses = computed(() => this.ingresosMes().reduce((s, b) => s + b.valor, 0));

  protected readonly entrenosSemana = computed(() => {
    const hoy = new Date(hoyISO() + 'T00:00:00');
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    return Array.from({ length: 8 }, (_, k) => {
      const ini = new Date(lunes);
      ini.setDate(lunes.getDate() - 7 * (7 - k));
      const dias = Array.from({ length: 7 }, (_, d) => { const x = new Date(ini); x.setDate(ini.getDate() + d); return isoDe(x); });
      let valor = 0, faltas = 0;
      this.datos.atletas().forEach((a) => dias.forEach((iso) => { if (a.asistencia[iso] === 'E') valor++; else if (a.asistencia[iso] === 'F') faltas++; }));
      const etiqueta = `${ini.getDate()} ${MESES_CORTOS[ini.getMonth()]}`;
      return { etiqueta, valor, faltas, detalle: `Semana del ${etiqueta} · ${faltas} falta${faltas === 1 ? '' : 's'}` };
    });
  });
  protected readonly pctAsistencia8 = computed(() => {
    const e = this.entrenosSemana().reduce((s, b) => s + b.valor, 0);
    const f = this.entrenosSemana().reduce((s, b) => s + b.faltas, 0);
    return e + f ? Math.round((e / (e + f)) * 100) : null;
  });

  /* ---------- Reporte mensual (PDF) ---------- */
  private readonly pdf = inject(PdfService);
  protected readonly reporteAbierto = signal(false);
  protected readonly meses = mesesReporte();
  protected mesReporte = this.meses[0].valor;

  async generarReporte() {
    await this.pdf.reporteMensual(this.datos.atletas(), this.mesReporte);
    this.reporteAbierto.set(false);
    this.ui.toast('Reporte de ' + this.meses.find((m) => m.valor === this.mesReporte)!.etiqueta.replace(' (mes actual)', '') + ' descargado ✓');
  }

  ir(id: string, tab?: string) {
    this.router.navigate(['/atletas', id], tab ? { queryParams: { tab } } : {});
  }

  alEliminarGrupo(id: string) {
    if (this.filtroGrupo() === id) this.filtroGrupo.set('todos');
  }

  private firma() {
    const p = this.auth.perfil();
    return p?.nombre ? '\n— ' + p.nombre : '';
  }

  recordarPago(a: Atleta) {
    const monto = a.tarifa ? fmtDinero(a.tarifa) : 'tu mensualidad';
    const d = diasDesde(a.proximoPago) ?? 0;
    abrirWhatsApp(a, `Hola ${primerNombre(a.nombre)} 👋 Te recuerdo que tu mensualidad de ${monto} venció hace ${d} día${d === 1 ? '' : 's'} (${fmtFecha(a.proximoPago)}). ¿Coordinamos el pago? 💪${this.firma()}`);
  }

  felicitar(a: Atleta, edad: number) {
    abrirWhatsApp(a,
      `🎉🎂 ¡FELIZ CUMPLEAÑOS, ${primerNombre(a.nombre).toUpperCase()}! 🎂🎉\n\n¡${edad} años y cada vez más fuerte! 💪 ` +
      `Que este nuevo año venga cargado de salud, metas cumplidas y muchos PRs en el gym.\n\n¡Disfruta tu día! 🥳${this.firma()}`);
  }

  protected readonly hoy = hoyISO;
}
