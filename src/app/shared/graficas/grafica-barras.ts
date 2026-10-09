import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { compacto, ticksLimpios } from './escala';

export interface Barra { etiqueta: string; valor: number; detalle?: string }

const H = 220;
const M = { izq: 50, der: 12, arr: 22, aba: 28 };

/**
 * Columnas de una sola serie (dataviz): ≤ 24px de grosor, punta redondeada 4px y base recta,
 * etiqueta solo en la columna destacada (la última), tooltip por columna con zona de toque
 * del ancho completo de la banda.
 */
@Component({
  selector: 'app-grafica-barras',
  template: `
    <div class="grafica" #caja>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" [attr.aria-label]="titulo()">
        @for (t of ticks(); track t) {
          <line [attr.x1]="M.izq" [attr.x2]="W - M.der" [attr.y1]="y(t)" [attr.y2]="y(t)" stroke="var(--rejilla)" stroke-width="1" />
          <text class="eje" [attr.x]="M.izq - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ formatoEje()(t) }}</text>
        }
        @for (b of geometria(); track b.etiqueta; let i = $index; let ultimo = $last) {
          @if (b.alto > 0) {
            <path class="barra" [class.activa]="activo() === i" [attr.d]="b.d" [attr.fill]="color()" />
          }
          @if (b.verEtiqueta) { <text class="eje" [attr.x]="b.cx" [attr.y]="H - 8" text-anchor="middle">{{ b.etiqueta }}</text> }
          @if (ultimo && b.valor > 0) {
            <text class="valor-fin" [attr.x]="b.cx" [attr.y]="b.yTop - 7" text-anchor="middle">{{ formato()(b.valor) }}</text>
          }
          <!-- Zona de toque: toda la banda -->
          <rect class="zona-hit" style="cursor:default" [attr.x]="b.banda0" [attr.y]="M.arr" [attr.width]="b.anchoBanda" [attr.height]="H - M.arr - M.aba"
            tabindex="0" [attr.aria-label]="b.etiqueta + ': ' + formato()(b.valor)"
            (pointerenter)="activo.set(i)" (pointerleave)="activo.set(null)" (focus)="activo.set(i)" (blur)="activo.set(null)" />
        }
      </svg>
      @if (activo() !== null) {
        @let b = geometria()[activo()!];
        <div class="tooltip-graf" [style.left.%]="(b.cx / W) * 100" [style.top.%]="(b.yTop / H) * 100">
          <b>{{ formato()(b.valor) }}</b>
          <span><i class="clave" [style.background]="color()"></i>{{ b.detalle || b.etiqueta }}</span>
        </div>
      }
    </div>
  `,
})
export class GraficaBarras {
  readonly barras = input.required<Barra[]>();
  readonly titulo = input('');
  readonly color = input('var(--serie-ambar)');
  /** Formato del valor (tooltip y etiqueta). */
  readonly formato = input<(n: number) => string>((n) => compacto(n));
  /** Formato del eje Y (compacto por defecto). */
  readonly formatoEje = input<(n: number) => string>((n) => compacto(n));

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
  protected readonly activo = signal<number | null>(null);

  protected readonly ticks = computed(() => ticksLimpios(0, Math.max(1, ...this.barras().map((b) => b.valor)), 4));

  y(v: number) {
    const t = this.ticks();
    return M.arr + (H - M.arr - M.aba) * (1 - v / t[t.length - 1]);
  }

  protected readonly geometria = computed(() => {
    const bs = this.barras();
    const anchoBanda = (this.W - M.izq - M.der) / Math.max(1, bs.length);
    const grosor = Math.min(24, anchoBanda * 0.6);
    const base = H - M.aba;
    // Si las etiquetas no caben (≈6.5px por carácter a 11px), se muestra una de cada "paso", contando desde la última
    const anchoEtiqueta = Math.max(...bs.map((b) => b.etiqueta.length)) * 6.5 + 10;
    const paso = Math.max(1, Math.ceil(anchoEtiqueta / anchoBanda));
    return bs.map((b, i) => {
      const cx = M.izq + anchoBanda * (i + 0.5);
      const yTop = this.y(b.valor);
      const alto = base - yTop;
      const r = Math.min(4, alto, grosor / 2);
      const x0 = cx - grosor / 2, x1 = cx + grosor / 2;
      // Punta redondeada, base recta
      const d = `M${x0},${base} L${x0},${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} L${x1 - r},${yTop} Q${x1},${yTop} ${x1},${yTop + r} L${x1},${base} Z`;
      return { ...b, cx, yTop, alto, d, banda0: M.izq + anchoBanda * i, anchoBanda, verEtiqueta: (bs.length - 1 - i) % paso === 0 };
    });
  });
}
