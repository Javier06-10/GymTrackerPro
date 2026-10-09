import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatosService } from '../../core/datos.service';
import { nombreComposicion, nombreObjetivo } from '../../core/dominio';
import { UiService } from '../../core/ui.service';
import { abrirWhatsApp, primerNombre } from '../../core/whatsapp';
import { AvatarIniciales } from '../../shared/avatar-iniciales';
import { TabAsistencia } from './tabs/asistencia';
import { TabBitacora } from './tabs/bitacora';
import { TabMedidas } from './tabs/medidas';
import { TabNutricion } from './tabs/nutricion';
import { TabObjetivos } from './tabs/objetivos';
import { TabPagos } from './tabs/pagos';
import { TabPerfil } from './tabs/perfil';
import { TabRutinas } from './tabs/rutinas';

const TABS: [string, string, string][] = [
  ['perfil', '👤', 'Perfil'],
  ['medidas', '📏', 'Medidas'],
  ['rutinas', '📋', 'Rutinas'],
  ['nutricion', '🍎', 'Nutrición'],
  ['asistencia', '📅', 'Asistencia'],
  ['objetivos', '🎯', 'Objetivos'],
  ['bitacora', '📝', 'Bitácora'],
  ['pagos', '💰', 'Pagos'],
];

/** Vista del atleta con pestañas (portado de renderCliente). */
@Component({
  selector: 'app-atleta-page',
  imports: [RouterLink, AvatarIniciales, TabPerfil, TabMedidas, TabRutinas, TabNutricion, TabAsistencia, TabObjetivos, TabBitacora, TabPagos],
  template: `
    @if (atleta(); as a) {
      <a class="volver" routerLink="/panel">← Volver al panel</a>
      <div class="encabezado-cliente">
        <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" [tam]="58" />
        <div style="flex:1;">
          <h2>{{ a.nombre }}</h2>
          <div class="meta">
            {{ a.genero === 'mujer' ? 'Mujer' : 'Hombre' }}{{ a.edad ? ' · ' + a.edad + ' años' : '' }} ·
            {{ a.estaturaPies }}'{{ a.estaturaPulg }}" · {{ comp(a.composicion) }} · {{ obj(a.objetivo) }}
          </div>
        </div>
        @if (a.grupoId) { <span class="chip chip-acero">👥 {{ datos.nombreGrupo(a.grupoId) }}</span> }
        @if (a.activo) { <span class="chip chip-verde">Activo</span> } @else { <span class="chip chip-gris">Inactivo</span> }
        @if (a.telefono) { <button class="btn btn-suave btn-mini" (click)="saludar()">💬 WhatsApp</button> }
      </div>
      <div class="tabs">
        @for (t of tabs; track t[0]) {
          <div class="tab" [class.activa]="tabActual() === t[0]" (click)="cambiarTab(t[0])">
            <span class="tab-ico">{{ t[1] }}</span><span class="tab-lbl">{{ t[2] }}</span>
          </div>
        }
      </div>
      @switch (tabActual()) {
        @case ('perfil') { <app-tab-perfil [atleta]="a" /> }
        @case ('medidas') { <app-tab-medidas [atleta]="a" /> }
        @case ('rutinas') { <app-tab-rutinas [atleta]="a" /> }
        @case ('nutricion') { <app-tab-nutricion [atleta]="a" (irA)="cambiarTab($event)" /> }
        @case ('asistencia') { <app-tab-asistencia [atleta]="a" /> }
        @case ('objetivos') { <app-tab-objetivos [atleta]="a" /> }
        @case ('bitacora') { <app-tab-bitacora [atleta]="a" /> }
        @case ('pagos') { <app-tab-pagos [atleta]="a" /> }
      }
    } @else {
      <div class="vacio">
        <span class="ic">🔍</span>
        <h3>No encontramos este atleta</h3>
        <a class="btn btn-primario" routerLink="/panel">Volver al panel</a>
      </div>
    }
  `,
})
export class AtletaPage {
  /** Viene de la ruta /atletas/:id y del query param ?tab= */
  readonly id = input.required<string>();
  readonly tab = input<string>();

  protected readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);
  protected readonly tabs = TABS;
  protected readonly comp = nombreComposicion;
  protected readonly obj = nombreObjetivo;

  protected readonly atleta = computed(() => this.datos.atleta(this.id()));
  protected readonly tabActual = computed(() => {
    const t = this.tab();
    return t && TABS.some((x) => x[0] === t) ? t : 'perfil';
  });

  cambiarTab(tab: string) {
    this.router.navigate([], { queryParams: { tab }, replaceUrl: true });
  }

  saludar() {
    const a = this.atleta();
    if (a && !abrirWhatsApp(a, 'Hola ' + primerNombre(a.nombre) + ' 👋 ')) {
      this.ui.toast('Este atleta no tiene teléfono. Agrégalo con ✏️ en su Perfil', 'err');
    }
  }
}
