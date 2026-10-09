import { Component, input, output } from '@angular/core';
import { Icono } from './icono';

/** Modal con el estilo de la plantilla. El pie se proyecta con [pie]. */
@Component({
  selector: 'app-modal',
  imports: [Icono],
  template: `
    <div class="overlay" (click)="$event.target === $event.currentTarget && cerrar.emit()">
      <div class="modal" [style.max-width]="ancho()">
        <div class="cab-modal">
          <h3>{{ titulo() }}</h3>
          <button class="btn-x" type="button" (click)="cerrar.emit()" aria-label="Cerrar"><app-icono nombre="cerrar" [tam]="16" /></button>
        </div>
        <div class="cuerpo-modal"><ng-content /></div>
        <div class="pie-modal"><ng-content select="[pie]" /></div>
      </div>
    </div>
  `,
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly ancho = input('520px');
  readonly cerrar = output<void>();
}
