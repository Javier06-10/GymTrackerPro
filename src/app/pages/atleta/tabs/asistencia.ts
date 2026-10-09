import { Component, computed, inject, input, signal } from '@angular/core';
import { DatosService } from '../../../core/datos.service';
import { rachaActual } from '../../../core/dominio';
import { Atleta, EstadoAsistencia } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';
import { MESES_ES, hoyISO } from '../../../core/util';

interface CeldaDia { iso: string; num: number; estado?: EstadoAsistencia; hoy: boolean; futuro: boolean }

/** Calendario de asistencia: vacío → ✓ entrenó → ✕ faltó → vacío (portado de tabAsistencia). */
@Component({
  selector: 'app-tab-asistencia',
  template: `
    @let r = resumen();
    <div class="grid-metricas">
      <div class="metrica m-verde"><div class="etiqueta">Días entrenados · {{ mesNombre() }}</div>
        <div class="valor">{{ r.entrenadosMes }}</div><div class="sub">{{ r.totalE }} en total histórico</div></div>
      <div class="metrica m-rojo"><div class="etiqueta">Días faltados · {{ mesNombre() }}</div>
        <div class="valor">{{ r.faltadosMes }}</div><div class="sub">{{ r.totalF }} en total histórico</div></div>
      <div class="metrica"><div class="etiqueta">Asistencia · {{ mesNombre() }}</div>
        <div class="valor">{{ r.pctMes === null ? '—' : r.pctMes + '%' }}</div>
        <div class="sub">{{ r.pctTotal === null ? 'Sin días marcados' : r.pctTotal + '% histórico' }}</div></div>
      <div class="metrica m-acero"><div class="etiqueta">Racha actual</div>
        <div class="valor">🔥 {{ racha() }}</div><div class="sub">Entrenamientos seguidos sin faltar</div></div>
    </div>

    <div class="tarjeta">
      <div class="cal-nav">
        <button class="btn btn-suave btn-mini" (click)="cambiarMes(-1)">←</button>
        <div class="cal-titulo">{{ mesNombre() }} {{ mes().a }}</div>
        <button class="btn btn-suave btn-mini" (click)="cambiarMes(1)">→</button>
      </div>
      <div class="cal-grid cal-cabecera">
        @for (d of ['L', 'M', 'M', 'J', 'V', 'S', 'D']; track $index) { <div>{{ d }}</div> }
      </div>
      <div class="cal-grid">
        @for (x of huecos(); track $index) { <div class="cal-dia fuera"></div> }
        @for (c of celdas(); track c.iso) {
          <div class="cal-dia" [class.entrenado]="c.estado === 'E'" [class.falto]="c.estado === 'F'" [class.hoy]="c.hoy" [class.futuro]="c.futuro"
            [title]="c.estado === 'E' ? 'Entrenó' : c.estado === 'F' ? 'Faltó' : 'Sin marcar'" (click)="!c.futuro && ciclo(c.iso)">
            <span class="num">{{ c.num }}</span>
            <span class="marca">{{ c.estado === 'E' ? '✓' : c.estado === 'F' ? '✕' : '' }}</span>
          </div>
        }
      </div>
      <div class="cal-leyenda">
        <span><span class="punto" style="background:var(--verde)"></span>Entrenó</span>
        <span><span class="punto" style="background:var(--rojo)"></span>Faltó</span>
        <span>Toca un día para alternar: vacío → ✓ entrenó → ✕ faltó → vacío</span>
      </div>
    </div>
  `,
})
export class TabAsistencia {
  readonly atleta = input.required<Atleta>();
  private readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);

  protected readonly mes = signal({ a: new Date().getFullYear(), m: new Date().getMonth() });
  protected readonly mesNombre = computed(() => MESES_ES[this.mes().m]);
  protected readonly racha = computed(() => rachaActual(this.atleta()));
  protected readonly huecos = computed(() => Array((new Date(this.mes().a, this.mes().m, 1).getDay() + 6) % 7)); // lunes = 0

  protected readonly celdas = computed<CeldaDia[]>(() => {
    const { a, m } = this.mes();
    const asis = this.atleta().asistencia;
    const isoHoy = hoyISO();
    const diasEnMes = new Date(a, m + 1, 0).getDate();
    return Array.from({ length: diasEnMes }, (_, i) => {
      const iso = a + '-' + String(m + 1).padStart(2, '0') + '-' + String(i + 1).padStart(2, '0');
      return { iso, num: i + 1, estado: asis[iso], hoy: iso === isoHoy, futuro: iso > isoHoy };
    });
  });

  protected readonly resumen = computed(() => {
    const celdas = this.celdas();
    const entrenadosMes = celdas.filter((c) => c.estado === 'E').length;
    const faltadosMes = celdas.filter((c) => c.estado === 'F').length;
    const valores = Object.values(this.atleta().asistencia);
    const totalE = valores.filter((v) => v === 'E').length;
    const totalF = valores.filter((v) => v === 'F').length;
    const marcadosMes = entrenadosMes + faltadosMes;
    const totalMarcados = totalE + totalF;
    return {
      entrenadosMes, faltadosMes, totalE, totalF,
      pctMes: marcadosMes ? Math.round((entrenadosMes / marcadosMes) * 100) : null,
      pctTotal: totalMarcados ? Math.round((totalE / totalMarcados) * 100) : null,
    };
  });

  cambiarMes(delta: number) {
    let { a, m } = this.mes();
    m += delta;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    this.mes.set({ a, m });
  }

  async ciclo(iso: string) {
    const asistencia = { ...this.atleta().asistencia };
    const actual = asistencia[iso];
    if (!actual) asistencia[iso] = 'E';
    else if (actual === 'E') asistencia[iso] = 'F';
    else delete asistencia[iso];
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { asistencia });
    } catch (e) {
      this.ui.error(e);
    }
  }
}
