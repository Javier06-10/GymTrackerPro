import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { construirManual } from '../../core/manual';
import { SvgSeguroPipe } from '../../shared/svg-seguro.pipe';
import { Icono } from '../../shared/icono';

type Genero = 'mujer' | 'hombre';
const CLAVE_GENERO = 'gt-manual-genero';

function generoGuardado(): Genero {
  try {
    return localStorage.getItem(CLAVE_GENERO) === 'hombre' ? 'hombre' : 'mujer';
  } catch {
    return 'mujer';
  }
}

/** Manual del entrenador con capítulos navegables (portado de renderManual). */
@Component({
  selector: 'app-manual',
  imports: [RouterLink, SvgSeguroPipe, Icono],
  template: `
    <a class="volver" routerLink="/panel">← Volver al panel</a>
    <section class="cab-pagina">
      <div class="cab-ico"><app-icono nombre="libro" [tam]="24" /></div>
      <div class="cab-texto">
        <h1>Manual del Entrenador</h1>
        <p>Entrenamiento femenino · {{ capitulos().length - 1 }} capítulos con evidencia, técnica y fichas de ejercicio.</p>
        <div class="cab-progreso">
          <span>Capítulo {{ indice() }} de {{ capitulos().length - 1 }}</span>
          <div class="barra-uso"><span [style.width.%]="(indice() / (capitulos().length - 1)) * 100"></span></div>
        </div>
      </div>
      <div class="cab-acciones">
        <span class="cab-etq">Figuras</span>
        <div class="segmentado" role="group" aria-label="Figuras de los ejercicios">
          <button [class.activo]="genero() === 'mujer'" (click)="cambiarGenero('mujer')"><app-icono nombre="mujer" [tam]="14" /> Mujer</button>
          <button [class.activo]="genero() === 'hombre'" (click)="cambiarGenero('hombre')"><app-icono nombre="hombre" [tam]="14" /> Hombre</button>
        </div>
      </div>
    </section>
    <div class="manual-layout">
      <div class="manual-nav">
        @for (c of capitulos(); track c.id; let i = $index) {
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

  protected readonly genero = signal<Genero>(generoGuardado());
  protected readonly capitulos = computed(() => construirManual(this.genero()));

  protected readonly indice = computed(() => Math.max(0, this.capitulos().findIndex((c) => c.id === this.cap())));
  protected readonly actual = computed(() => this.capitulos()[this.indice()]);
  protected readonly anterior = computed(() => this.capitulos()[this.indice() - 1] ?? null);
  protected readonly siguiente = computed(() => this.capitulos()[this.indice() + 1] ?? null);

  cambiarGenero(g: Genero) {
    this.genero.set(g);
    try {
      localStorage.setItem(CLAVE_GENERO, g);
    } catch {
      /* sin almacenamiento: solo dura la sesión */
    }
  }

  ir(id: string) {
    this.router.navigate([], { queryParams: { cap: id } });
    window.scrollTo({ top: 0 });
  }
}
