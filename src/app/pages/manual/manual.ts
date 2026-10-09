import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { construirManual } from '../../core/manual';
import { SvgSeguroPipe } from '../../shared/svg-seguro.pipe';

const CAPITULOS = construirManual();

/** Manual del entrenador con capítulos navegables (portado de renderManual). */
@Component({
  selector: 'app-manual',
  imports: [RouterLink, SvgSeguroPipe],
  template: `
    <a class="volver" routerLink="/panel">← Volver al panel</a>
    <div class="manual-portada">
      <div class="manual-icono">📖</div>
      <div>
        <div class="manual-titulo">Manual del Entrenador</div>
        <div class="manual-sub">Entrenamiento Femenino · Formación para entrenador personal</div>
      </div>
    </div>
    <div class="manual-layout">
      <div class="manual-nav">
        @for (c of capitulos; track c.id; let i = $index) {
          <div class="manual-nav-item" [class.activo]="c.id === actual().id" (click)="ir(c.id)">
            <span class="num">{{ i === 0 ? '—' : i }}</span> {{ c.t }}
          </div>
        }
      </div>
      <div class="manual-cuerpo">
        <!-- Contenido estático del manual (incluye figuras SVG), no datos del usuario -->
        <div [innerHTML]="actual().h | svgSeguro"></div>
        <div class="manual-pie">
          @if (anterior(); as p) { <button class="btn btn-suave" (click)="ir(p.id)">← {{ p.t }}</button> } @else { <span></span> }
          @if (siguiente(); as s) { <button class="btn btn-primario" (click)="ir(s.id)">{{ s.t }} →</button> } @else { <span></span> }
        </div>
      </div>
    </div>
  `,
})
export class Manual {
  /** Capítulo desde ?cap= */
  readonly cap = input<string>();
  private readonly router = inject(Router);
  protected readonly capitulos = CAPITULOS;

  protected readonly indice = computed(() => Math.max(0, CAPITULOS.findIndex((c) => c.id === this.cap())));
  protected readonly actual = computed(() => CAPITULOS[this.indice()]);
  protected readonly anterior = computed(() => CAPITULOS[this.indice() - 1] ?? null);
  protected readonly siguiente = computed(() => CAPITULOS[this.indice() + 1] ?? null);

  ir(id: string) {
    this.router.navigate([], { queryParams: { cap: id } });
    window.scrollTo({ top: 0 });
  }
}
