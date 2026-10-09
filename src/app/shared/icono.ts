import { Component, computed, input } from '@angular/core';
import { SvgSeguroPipe } from './svg-seguro.pipe';

/** Iconos de trazo (24×24, currentColor). Dibujos propios y estáticos. */
const ICONOS: Record<string, string> = {
  dinero: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
  usuarios: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.2c2.4.2 4.2 1.8 4.8 4.3"/>',
  alerta: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.2M12 16.8v.2"/>',
  actividad: '<path d="M2.5 12h4l2.5-6 4.5 12 2.5-6h5.5"/>',
  candado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
  nube: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.6 4.5 4.5 0 0 0 7 18.5z"/>',
  check: '<path d="m4.5 12.5 4.5 4.5 10-10"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  libro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  pesa: '<path d="M2.5 12h19"/><rect x="4.5" y="7" width="3" height="10" rx="1"/><rect x="16.5" y="7" width="3" height="10" rx="1"/><path d="M2.5 9.5v5M21.5 9.5v5"/>',
};

@Component({
  selector: 'app-icono',
  imports: [SvgSeguroPipe],
  template: `<span style="display:inline-flex" [innerHTML]="svg() | svgSeguro"></span>`,
})
export class Icono {
  readonly nombre = input.required<string>();
  readonly tam = input(18);
  protected readonly svg = computed(
    () => `<svg width="${this.tam()}" height="${this.tam()}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[this.nombre()] ?? ''}</svg>`,
  );
}
