import { Component } from '@angular/core';
import { dibujarAvatar } from '../core/avatar';
import { Icono } from './icono';
import { SvgSeguroPipe } from './svg-seguro.pipe';

/** Ilustración de marca: mapa muscular con progreso simulado (pecho, brazos y piernas creciendo, abdomen bajando). */
const ARTE = dibujarAvatar(
  {
    genero: 'hombre',
    composicion: 'musculo',
    medidas: [
      { fecha: '2026-01-01', peso: 180, pecho: 40, brazoRelajado: 14, brazoContraido: 15, antebrazo: 11.4, abdomenAlto: 33, abdomenOmbligo: 34, cadera: 39, pierna: 23, pantorrilla: 15 },
      { fecha: '2026-04-01', peso: 184, pecho: 42.5, brazoRelajado: 15.2, brazoContraido: 16.2, antebrazo: 12, abdomenAlto: 31.5, abdomenOmbligo: 32.5, cadera: 39.4, pierna: 24.4, pantorrilla: 15.6 },
    ],
  },
  'frente',
  190,
);

/** Panel izquierdo de las pantallas de entrada y registro: propuesta de valor y confianza. */
@Component({
  selector: 'app-marca-auth',
  imports: [Icono, SvgSeguroPipe],
  template: `
    <aside class="marca-auth">
      <div class="marca-texto">
      <div class="logo">
        <div class="icono icono-fenix"><img src="icons/fenix.svg" alt="" class="marca-fenix" /></div>
        <div><h1>COACH <span>FÉNIX</span></h1><small>Software para entrenadores</small></div>
      </div>
      <h2>Entrena mejor.<br />Mide el progreso.<br /><span>Cobra a tiempo.</span></h2>
      <p class="lema">Todo lo que un entrenador personal necesita para profesionalizar su servicio y retener a sus clientes.</p>
      <ul>
        <li><app-icono nombre="actividad" /> Medidas con mapa muscular que muestra qué creció</li>
        <li><app-icono nombre="pesa" /> Rutinas con catálogo de ejercicios e historial de cargas</li>
        <li><app-icono nombre="dinero" /> Control de cobros, recordatorios por WhatsApp y recibos</li>
        <li><app-icono nombre="grafico" /> Reportes en PDF de progreso y del negocio</li>
      </ul>
      <div class="confianza">
        <span><app-icono nombre="candado" [tam]="14" /> Conexión cifrada</span>
        <span><app-icono nombre="escudo" [tam]="14" /> Datos privados por entrenador</span>
        <span><app-icono nombre="check" [tam]="14" /> 14 días gratis, sin tarjeta</span>
      </div>
      </div>
      <div class="arte-caja" aria-hidden="true">
        <div class="arte" [innerHTML]="arte | svgSeguro"></div>
        <span class="dato-flota df-1"><b>+2.5 in</b> Pecho</span>
        <span class="dato-flota df-2"><b>+1.2 in</b> Brazo</span>
        <span class="dato-flota df-3 baja"><b>−1.5 in</b> Abdomen</span>
        <span class="dato-flota df-4"><app-icono nombre="fuego" [tam]="13" /> <b>12</b> días seguidos</span>
      </div>
    </aside>
  `,
})
export class MarcaAuth {
  protected readonly arte = ARTE;
}
