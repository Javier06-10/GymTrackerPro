import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from './core/ui.service';
import { Modal } from './shared/modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Modal],
  template: `
    <router-outlet />
    @if (ui.confirmacion(); as c) {
      <app-modal [titulo]="c.titulo" (cerrar)="ui.responder(false)">
        <p style="color:var(--texto-suave);font-size:14px;" [innerHTML]="c.mensaje"></p>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="ui.responder(false)">Cancelar</button>
          <button class="btn btn-peligro" (click)="ui.responder(true)">{{ c.textoBoton }}</button>
        </ng-container>
      </app-modal>
    }
    <div id="toast" [class]="ui.toastMsg() ? 'visible ' + ui.toastMsg()!.tipo : ''">{{ ui.toastMsg()?.texto }}</div>
  `,
})
export class App {
  protected readonly ui = inject(UiService);
}
