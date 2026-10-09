import { Component, computed, input } from '@angular/core';
import { iniciales } from '../core/util';

@Component({
  selector: 'app-avatar-iniciales',
  template: `<div class="avatar-mini" [class.mujer]="genero() === 'mujer'" [style.width.px]="tam()" [style.height.px]="tam()"
    [style.font-size.px]="tam() * 0.4">{{ texto() }}</div>`,
})
export class AvatarIniciales {
  readonly nombre = input.required<string>();
  readonly genero = input<string>('hombre');
  readonly tam = input(48);
  readonly texto = computed(() => iniciales(this.nombre()));
}
