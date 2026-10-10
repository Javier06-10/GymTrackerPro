import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaService } from './core/pwa.service';
import { UiService } from './core/ui.service';
import { Icono } from './shared/icono';
import { Modal } from './shared/modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Modal, Icono],
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

    @if (pwa.actualizacion()) {
      <div class="aviso-version" role="status">
        <app-icono nombre="recargar" [tam]="18" />
        <span><b>Hay una versión nueva</b> de GymTracker Pro.</span>
        <button class="btn btn-primario btn-mini" (click)="pwa.actualizar()">Actualizar</button>
        <button class="btn-x" aria-label="Más tarde" (click)="pwa.actualizacion.set(false)"><app-icono nombre="cerrar" [tam]="16" /></button>
      </div>
    }

    @if (pwa.ayudaIOS()) {
      <app-modal titulo="Instalar en iPhone o iPad" (cerrar)="pwa.ayudaIOS.set(false)">
        <ol class="pasos-ios">
          <li><span class="paso-n">1</span><span>Abre esta página en <b>Safari</b>.</span></li>
          <li><span class="paso-n">2</span><span>Toca el botón <b>Compartir</b> <app-icono nombre="compartir" [tam]="16" /> de la barra inferior.</span></li>
          <li><span class="paso-n">3</span><span>Elige <b>Agregar a inicio</b> y confirma con <b>Agregar</b>.</span></li>
        </ol>
        <p class="nota-info">GymTracker aparecerá en tu pantalla de inicio con su icono y se abrirá a pantalla completa, como una app.</p>
        <ng-container pie>
          <button class="btn btn-primario" (click)="pwa.ayudaIOS.set(false)">Entendido</button>
        </ng-container>
      </app-modal>
    }

    <div id="toast" [class]="ui.toastMsg() ? 'visible ' + ui.toastMsg()!.tipo : ''">{{ ui.toastMsg()?.texto }}</div>
  `,
})
export class App {
  protected readonly ui = inject(UiService);
  protected readonly pwa = inject(PwaService);
}
