import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { fmtFecha } from '../../core/util';
import { compacto, puntoEnSvg, ticksLimpios } from './escala';

export interface PuntoSerie { fecha: string; valor: number }

const H = 230;
const M = { izq: 46, der: 64, arr: 16, aba: 30 };

/**
 * Línea con área sobre eje de tiempo real.
 * Marcas según dataviz: línea 2px, área ~10%, punto final r=4 con anillo de superficie,
 * rejilla hairline sólida, etiqueta solo en el último valor y tooltip con línea vertical.
 */
@Component({
  selector: 'app-grafica-linea',
  template: `
    <div class="grafica" #caja>
      <svg #svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="descripcion()" tabindex="0"
        (pointermove)="mover($event)" (pointerleave)="activo.set(null)" (keydown)="teclado($event)" (blur)="activo.set(null)">
        <defs>
          <linearGradient [attr.id]="idGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity=".22" />
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Rejilla y eje Y -->
        @for (t of ticks(); track t) {
          <line [attr.x1]="M.izq" [attr.x2]="W - M.der" [attr.y1]="y(t)" [attr.y2]="y(t)" stroke="var(--rejilla)" stroke-width="1" />
          <text class="eje" [attr.x]="M.izq - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ compacto(t) }}</text>
        }
        <!-- Eje X: fechas -->
        @for (f of fechasEje(); track f.x) {
          <text class="eje" [attr.x]="f.x" [attr.y]="H - 8" [attr.text-anchor]="f.ancla">{{ f.txt }}</text>
        }

        <!-- Meta (referencia, no dato) -->
        @if (meta() !== null && metaVisible()) {
          <line [attr.x1]="M.izq" [attr.x2]="W - M.der" [attr.y1]="y(meta()!)" [attr.y2]="y(meta()!)"
            stroke="var(--texto-suave)" stroke-width="1" stroke-dasharray="5 4" />
          <text class="meta-txt" [attr.x]="W - M.der + 6" [attr.y]="yEtiquetaMeta()">Meta {{ meta() }}</text>
        }

        <path [attr.d]="area()" [attr.fill]="'url(#' + idGrad + ')'" />
        <path [attr.d]="linea()" fill="none" [attr.stroke]="color()" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

        <!-- Puntos de medición (pequeños) y punto final destacado -->
        @for (p of coords(); track $index; let ultimo = $last) {
          @if (!ultimo) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2.5" [attr.fill]="color()" stroke="var(--panel)" stroke-width="2" /> }
        }
        @if (fin(); as f) {
          <circle [attr.cx]="f.x" [attr.cy]="f.y" r="5" [attr.fill]="color()" stroke="var(--panel)" stroke-width="2" />
          <text class="valor-fin" [attr.x]="f.x + 10" [attr.y]="f.y + 4">{{ f.v }} {{ unidad() }}</text>
        }

        <!-- Capa de hover -->
        @if (activo() !== null) {
          @let a = coords()[activo()!];
          <line [attr.x1]="a.x" [attr.x2]="a.x" [attr.y1]="M.arr" [attr.y2]="H - M.aba" stroke="var(--texto-suave)" stroke-width="1" />
          <circle [attr.cx]="a.x" [attr.cy]="a.y" r="6" [attr.fill]="color()" stroke="var(--panel)" stroke-width="2" />
        }
        <rect class="zona-hit" [attr.x]="M.izq" [attr.y]="0" [attr.width]="W - M.izq - M.der + 30" [attr.height]="H" />
      </svg>

      @if (activo() !== null) {
        @let a = coords()[activo()!];
        <div class="tooltip-graf" [style.left.%]="(a.x / W) * 100" [style.top.%]="(a.y / H) * 100">
          <b>{{ a.v }} {{ unidad() }}</b>
          <span><i class="clave" [style.background]="color()"></i>{{ fecha(a.fecha) }}</span>
          @if (a.delta !== null) { <span> · {{ a.delta > 0 ? '+' : '' }}{{ a.delta }} vs anterior</span> }
        </div>
      }
    </div>
  `,
})
export class GraficaLinea {
  readonly puntos = input.required<PuntoSerie[]>();
  readonly unidad = input('');
  readonly titulo = input('');
  readonly meta = input<number | null>(null);
  readonly color = input('var(--serie-ambar)');

  /** Ancho real en px (ResizeObserver). */
  private readonly ancho = signal(600);
  protected get W() { return this.ancho(); }
  private readonly caja = viewChild.required<ElementRef<HTMLDivElement>>('caja');
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const ro = new ResizeObserver(([e]) => this.ancho.set(Math.max(260, Math.round(e.contentRect.width))));
      ro.observe(this.caja().nativeElement);
      destroy.onDestroy(() => ro.disconnect());
    });
  }
  protected readonly H = H;
  protected readonly M = M;
  protected readonly compacto = compacto;
  protected readonly fecha = fmtFecha;
  protected readonly idGrad = 'gl-' + Math.random().toString(36).slice(2, 8);
  protected readonly activo = signal<number | null>(null);
  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  private readonly tiempo = (iso: string) => new Date(iso + 'T00:00:00').getTime();

  /** Dominio Y: datos + meta (si está cerca), con ticks limpios. */
  protected readonly ticks = computed(() => {
    const vals = this.puntos().map((p) => p.valor);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    const m = this.meta();
    if (m !== null && this.metaVisible()) {
      min = Math.min(min, m);
      max = Math.max(max, m);
    }
    const pad = (max - min || 1) * 0.08;
    return ticksLimpios(min - pad, max + pad, 4);
  });
  /** La meta solo se dibuja si no aplasta la serie (dentro de 3× el rango de los datos). */
  protected readonly metaVisible = computed(() => {
    const m = this.meta();
    if (m === null) return false;
    const vals = this.puntos().map((p) => p.valor);
    const min = Math.min(...vals), max = Math.max(...vals);
    const rango = Math.max(max - min, Math.abs(max) * 0.05, 1);
    return m >= min - 3 * rango && m <= max + 3 * rango;
  });

  y(v: number) {
    const t = this.ticks();
    const lo = t[0], hi = t[t.length - 1];
    return M.arr + (H - M.arr - M.aba) * (1 - (v - lo) / (hi - lo));
  }

  private x(iso: string) {
    const ps = this.puntos();
    const t0 = this.tiempo(ps[0].fecha), t1 = this.tiempo(ps[ps.length - 1].fecha);
    return M.izq + 8 + (this.W - M.izq - M.der - 16) * (t1 === t0 ? 0.5 : (this.tiempo(iso) - t0) / (t1 - t0));
  }

  protected readonly coords = computed(() =>
    this.puntos().map((p, i, arr) => ({
      x: this.x(p.fecha),
      y: this.y(p.valor),
      v: p.valor,
      fecha: p.fecha,
      delta: i > 0 ? Number((p.valor - arr[i - 1].valor).toFixed(1)) : null,
    })),
  );
  protected readonly fin = computed(() => this.coords()[this.coords().length - 1] ?? null);
  /** Y de la etiqueta de la meta: se aparta si choca con la etiqueta del valor final. */
  protected readonly yEtiquetaMeta = computed(() => {
    const m = this.meta();
    if (m === null) return 0;
    const ym = this.y(m) + 4;
    const f = this.fin();
    if (!f || Math.abs(ym - (f.y + 4)) >= 14) return ym;
    return ym > f.y + 4 ? f.y + 4 + 14 : f.y + 4 - 14;
  });

  protected readonly linea = computed(() => this.coords().map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' '));
  protected readonly area = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    const base = H - M.aba;
    return `${this.linea()} L${c[c.length - 1].x.toFixed(1)},${base} L${c[0].x.toFixed(1)},${base} Z`;
  });

  /** Primera y última fecha siempre; intermedias si hay espacio (≥ 90 unidades entre etiquetas). */
  protected readonly fechasEje = computed(() => {
    const c = this.coords();
    if (!c.length) return [];
    const out: { x: number; txt: string; ancla: string }[] = [{ x: c[0].x, txt: fmtFecha(c[0].fecha), ancla: 'start' }];
    const ult = c[c.length - 1];
    for (let i = 1; i < c.length - 1; i++) {
      if (c[i].x - out[out.length - 1].x >= 90 && ult.x - c[i].x >= 90) out.push({ x: c[i].x, txt: fmtFecha(c[i].fecha), ancla: 'middle' });
    }
    if (c.length > 1) out.push({ x: ult.x, txt: fmtFecha(ult.fecha), ancla: 'end' });
    return out;
  });

  protected readonly descripcion = computed(() => {
    const p = this.puntos();
    if (!p.length) return this.titulo();
    return `${this.titulo()}: de ${p[0].valor} a ${p[p.length - 1].valor} ${this.unidad()} entre ${fmtFecha(p[0].fecha)} y ${fmtFecha(p[p.length - 1].fecha)}`;
  });

  mover(ev: PointerEvent) {
    const { x } = puntoEnSvg(ev, this.svg().nativeElement, this.W);
    const c = this.coords();
    let mejor = 0;
    c.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(c[mejor].x - x)) mejor = i; });
    this.activo.set(mejor);
  }

  teclado(ev: KeyboardEvent) {
    const n = this.coords().length;
    const a = this.activo() ?? n - 1;
    if (ev.key === 'ArrowLeft') this.activo.set(Math.max(0, a - 1));
    else if (ev.key === 'ArrowRight') this.activo.set(Math.min(n - 1, a + 1));
    else return;
    ev.preventDefault();
  }
}
