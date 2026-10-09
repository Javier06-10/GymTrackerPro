import { Component, computed, input } from '@angular/core';
import { fmtFecha } from '../../core/util';

/**
 * Mini‑gráfica de progresión (historial de carga). Sin ejes: la acompaña el rango
 * "inicio → actual" en texto y la lista completa debajo hace de vista de tabla.
 */
@Component({
  selector: 'app-sparkline',
  template: `
    @if (puntos().length >= 2) {
      <div class="sparkline">
        <svg viewBox="0 0 200 36" preserveAspectRatio="none" role="img" [attr.aria-label]="descripcion()">
          <path [attr.d]="area()" [attr.fill]="color()" fill-opacity=".12" />
          <path [attr.d]="linea()" fill="none" [attr.stroke]="color()" stroke-width="2" vector-effect="non-scaling-stroke"
            stroke-linejoin="round" stroke-linecap="round" />
        </svg>
        <div class="rango">{{ primero() }} → <b>{{ ultimo() }}</b>
          @if (cambio() !== 0) { <span [class]="cambio() > 0 ? 'delta-pos' : 'delta-neg'"> {{ cambio() > 0 ? '+' : '' }}{{ cambio() }}</span> }
        </div>
      </div>
    }
  `,
})
export class Sparkline {
  /** Registros {fecha, peso} con el peso como texto ("135 lb"); se toma el número. */
  readonly registros = input.required<{ fecha: string; peso: string }[]>();
  readonly color = input('var(--serie-azul)');

  protected readonly puntos = computed(() =>
    this.registros()
      .map((r) => ({ fecha: r.fecha, v: parseFloat(String(r.peso).replace(',', '.')) }))
      .filter((p) => !isNaN(p.v)),
  );
  private readonly coords = computed(() => {
    const ps = this.puntos();
    const vs = ps.map((p) => p.v);
    let min = Math.min(...vs), max = Math.max(...vs);
    if (min === max) { min -= 1; max += 1; }
    return ps.map((p, i) => ({ x: 2 + (196 * i) / Math.max(1, ps.length - 1), y: 4 + 28 * (1 - (p.v - min) / (max - min)) }));
  });
  protected readonly linea = computed(() => this.coords().map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' '));
  protected readonly area = computed(() => {
    const c = this.coords();
    return c.length ? `${this.linea()} L${c[c.length - 1].x},36 L${c[0].x},36 Z` : '';
  });
  protected readonly primero = computed(() => this.registros().find((r) => !isNaN(parseFloat(r.peso)))?.peso ?? '');
  protected readonly ultimo = computed(() => [...this.registros()].reverse().find((r) => !isNaN(parseFloat(r.peso)))?.peso ?? '');
  protected readonly cambio = computed(() => {
    const p = this.puntos();
    return p.length ? Math.round((p[p.length - 1].v - p[0].v) * 10) / 10 : 0;
  });
  protected readonly descripcion = computed(() => {
    const p = this.puntos();
    return p.length ? `Carga de ${p[0].v} a ${p[p.length - 1].v} entre ${fmtFecha(p[0].fecha)} y ${fmtFecha(p[p.length - 1].fecha)}` : '';
  });
}
