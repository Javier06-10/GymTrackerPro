import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { medicionPendiente, pagoVencido, ultimaMedida } from '../../core/dominio';
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

/** Dashboard — balance global del entrenador (portado de renderDashboard). */
@Component({
  selector: 'app-panel',
  imports: [FormsModule, AvatarIniciales, GruposModal, Modal, GraficaBarras],
  template: `
    <div class="grid-metricas">
      <div class="metrica m-verde">
        <div class="etiqueta">Ingresos · Últimos 30 días</div>
        <div class="valor">{{ dinero(ingresos30()) }}</div>
        <div class="sub">Suma de pagos registrados</div>
      </div>
      <div class="metrica m-acero">
        <div class="etiqueta">Atletas Activos</div>
        <div class="valor">{{ activos() }}{{ limite() ? ' / ' + limite() : '' }}</div>
        <div class="sub">{{ inactivos() }} inactivo{{ inactivos() === 1 ? '' : 's' }}{{ limite() ? ' · límite de tu plan' : '' }}</div>
      </div>
      <div class="metrica m-rojo">
        <div class="etiqueta">Cuentas por Cobrar</div>
        <div class="valor">{{ vencidos().length }}</div>
        <div class="sub">{{ dinero(porCobrar()) }} pendiente</div>
      </div>
    </div>

    @if (datos.atletas().length) {
      <div class="grid-graficas" style="margin-bottom:6px;">
        <div class="tarjeta">
          <div class="grafica-cab">
            <span class="t">💰 Ingresos por mes</span>
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
            <span class="t">🏋️ Entrenamientos por semana</span>
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
      <div class="titulo-seccion">🔔 Alertas de cobro</div>
      @for (a of vencidos(); track a.id) {
        <div class="alerta-cobro" (click)="ir(a.id, 'pagos')">
          <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" [tam]="38" />
          <div class="nombre">{{ a.nombre }}</div>
          <div class="dias">Vencido hace {{ dias(a.proximoPago) }} día{{ dias(a.proximoPago) === 1 ? '' : 's' }}</div>
          <div class="monto">{{ dinero(a.tarifa) }}</div>
          @if (a.telefono) {
            <button class="btn-x" title="Recordar por WhatsApp" style="font-size:17px;" (click)="$event.stopPropagation(); recordarPago(a)">💬</button>
          }
        </div>
      }
    }

    @if (cumples().length) {
      <div class="titulo-seccion">🎂 Cumpleaños</div>
      @for (x of cumples(); track x.a.id) {
        <div class="alerta-cobro" style="border-color:rgba(255,154,61,.4);border-left-color:var(--ambar);" (click)="ir(x.a.id)">
          <div style="font-size:22px;">🎂</div>
          <div class="nombre">{{ x.a.nombre }}</div>
          <div class="dias" style="color:var(--ambar);">
            @if (x.pc.dias === 0) { ¡Cumple HOY {{ x.pc.edadCumple }} años! 🎉 }
            @else if (x.pc.dias === 1) { Cumple mañana {{ x.pc.edadCumple }} años }
            @else { Cumple {{ x.pc.edadCumple }} en {{ x.pc.dias }} días ({{ fecha(x.pc.fecha) }}) }
          </div>
          @if (x.a.telefono && x.pc.dias === 0) {
            <button class="btn btn-suave btn-mini" (click)="$event.stopPropagation(); felicitar(x.a, x.pc.edadCumple)">💬 Felicitar</button>
          }
        </div>
      }
    }

    @if (pendMed().length) {
      <div class="titulo-seccion">📏 Mediciones pendientes</div>
      @for (a of pendMed(); track a.id) {
        <div class="alerta-cobro" style="border-color:rgba(91,141,184,.35);border-left-color:var(--acero);" (click)="ir(a.id, 'medidas')">
          <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" [tam]="38" />
          <div class="nombre">{{ a.nombre }}</div>
          <div class="dias" style="color:var(--acero);">Última medición hace {{ diasMed(a) }} días</div>
        </div>
      }
    }

    <div class="titulo-seccion">👥 Mis Atletas</div>

    @if (!datos.atletas().length) {
      <div class="vacio">
        <span class="ic">🏋️‍♂️</span>
        <h3>Aún no tienes atletas registrados</h3>
        <p>Agrega tu primer cliente para empezar a llevar su progreso físico, rutinas y pagos.</p>
        <button class="btn btn-primario" (click)="ui.formAtleta.set({ id: null })" [disabled]="!auth.vigente()">＋ Agregar primer atleta</button>
      </div>
    } @else {
      <div class="barra-busqueda">
        <div class="campo-buscar">
          <span class="lupa">🔍</span>
          <input type="text" placeholder="Buscar atleta por nombre..." [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" />
        </div>
        <button class="btn btn-suave" (click)="gruposAbierto.set(true)">👥 Grupos</button>
        <button class="btn btn-suave" (click)="mesReporte = meses[0].valor; reporteAbierto.set(true)">📊 Reporte</button>
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
          <div class="card-atleta" (click)="ir(a.id)">
            <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" />
            <div class="info">
              <div class="nombre">{{ a.nombre }}</div>
              <div class="detalle">
                @if (ultima(a); as u) { {{ u.peso }} lb · última medición {{ fecha(u.fecha) }} } @else { Sin mediciones aún }
              </div>
              <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                @if (a.activo) { <span class="chip chip-verde">Activo</span> } @else { <span class="chip chip-gris">Inactivo</span> }
                @if (a.grupoId) { <span class="chip chip-acero">👥 {{ datos.nombreGrupo(a.grupoId) }}</span> }
                @if (cumpleHoy(a)) { <span class="chip chip-ambar">🎂 ¡Hoy!</span> }
                @if (vencido(a)) { <span class="chip chip-rojo">Pago vencido</span> }
              </div>
            </div>
          </div>
        } @empty {
          <div class="vacio" style="grid-column:1/-1;padding:30px;"><p>No se encontraron atletas con ese nombre.</p></div>
        }
      </div>
    }

    @if (reporteAbierto()) {
      <app-modal titulo="📊 Reporte Mensual del Negocio" (cerrar)="reporteAbierto.set(false)">
        <p style="color:var(--texto-suave);font-size:13.5px;">
          La foto del negocio en una página: ingresos, cuentas por cobrar, atletas, asistencia y seguimiento del mes elegido.
        </p>
        <div class="campo"><label>Mes del reporte</label>
          <select [(ngModel)]="mesReporte">@for (m of meses; track m.valor) { <option [value]="m.valor">{{ m.etiqueta }}</option> }</select>
        </div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="reporteAbierto.set(false)">Cancelar</button>
          <button class="btn btn-primario" (click)="generarReporte()">📄 Generar PDF</button>
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
