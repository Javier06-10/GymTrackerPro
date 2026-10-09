import { Component, computed, input } from '@angular/core';
import { iconoSvg } from '../core/iconos';
import { SvgSeguroPipe } from './svg-seguro.pipe';

/** Icono de trazo de la app (ver core/iconos.ts). */
@Component({
  selector: 'app-icono',
  imports: [SvgSeguroPipe],
  template: `<span class="icono-app" [innerHTML]="svg() | svgSeguro"></span>`,
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly tam = input(18);
  protected readonly svg = computed(() => iconoSvg(this.nombre(), this.tam(), 'ico'));
}
