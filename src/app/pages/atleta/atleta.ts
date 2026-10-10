import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatosService } from '../../core/datos.service';
import { deltaPeso, nombreComposicion, nombreObjetivo, rachaActual, ultimaMedida } from '../../core/dominio';
import { UiService } from '../../core/ui.service';
import { diasDesde, fmtFecha, hoyISO, iniciales } from '../../core/util';
import { abrirWhatsApp, primerNombre } from '../../core/whatsapp';
import { Icono } from '../../shared/icono';
import { UnidadesService } from '../../core/unidades';
import { TabAsistencia } from './tabs/asistencia';
import { TabBitacora } from './tabs/bitacora';
import { TabMedidas } from './tabs/medidas';
import { TabNutricion } from './tabs/nutricion';
import { TabObjetivos } from './tabs/objetivos';
import { TabPagos } from './tabs/pagos';
import { TabPerfil } from './tabs/perfil';
import { TabRutinas } from './tabs/rutinas';

const TABS: [string, string, string][] = [
  ['perfil', 'persona', 'Perfil'],
  ['medidas', 'regla', 'Medidas'],
  ['rutinas', 'rutina', 'Rutinas'],
  ['nutricion', 'manzana', 'Nutrición'],
  ['asistencia', 'calendario', 'Asistencia'],
  ['objetivos', 'diana', 'Objetivos'],
  ['bitacora', 'nota', 'Bitácora'],
  ['pagos', 'dinero', 'Pagos'],
];

const ICONO_OBJETIVO: Record<string, string> = { perder: 'fuego', ganar: 'tendencia', recomp: 'balanza', mantener: 'escudo' };

/** Ficha del atleta: cabecera de perfil deportivo + pestañas. */
@Component({
  selector: 'app-atleta-page',
  imports: [RouterLink, Icono, TabPerfil, TabMedidas, TabRutinas, TabNutricion, TabAsistencia, TabObjetivos, TabBitacora, TabPagos],
  template: `
    @if (atleta(); as a) {
      <a class="volver" routerLink="/panel">← Volver al panel</a>

      <section class="perfil-cab">
        <div class="ficha-identidad">
          <div class="ficha-avatar" [class.mujer]="a.genero === 'mujer'" [class.inactivo]="!a.activo">
            {{ ini(a.nombre) }}
            <span class="punto-estado" [title]="a.activo ? 'Activo' : 'Inactivo'"></span>
          </div>
          <div class="ficha-datos">
            <h2>{{ a.nombre }}</h2>
            <div class="ficha-etiquetas">
              <span class="etq"><app-icono [nombre]="a.genero === 'mujer' ? 'mujer' : 'hombre'" [tam]="14" /> {{ a.genero === 'mujer' ? 'Mujer' : 'Hombre' }}</span>
              @if (a.edad) { <span class="etq"><app-icono nombre="cumple" [tam]="14" /> {{ a.edad }} años</span> }
              <span class="etq"><app-icono nombre="regla" [tam]="14" /> {{ u.estatura(a.estaturaPies, a.estaturaPulg) }}</span>
              <span class="etq etq-ambar"><app-icono [nombre]="icoObjetivo(a.objetivo)" [tam]="14" /> {{ obj(a.objetivo) }}</span>
              @if (a.grupoId) { <span class="etq etq-azul"><app-icono nombre="usuarios" [tam]="14" /> {{ datos.nombreGrupo(a.grupoId) }}</span> }
              @if (a.activo) { <span class="etq etq-verde">Activo</span> } @else { <span class="etq">Inactivo</span> }
            </div>
            <div class="ficha-sub">{{ comp(a.composicion) }}{{ a.objetivoTexto ? ' · Meta: ' + a.objetivoTexto : '' }}</div>
          </div>
          <div class="ficha-acciones">
            @if (a.telefono) { <button class="btn btn-suave btn-mini" (click)="saludar()"><app-icono nombre="chat" [tam]="15" /> WhatsApp</button> }
            <button class="btn btn-suave btn-mini" (click)="ui.formAtleta.set({ id: a.id })"><app-icono nombre="editar" [tam]="15" /> Editar</button>
            <button class="btn btn-primario btn-mini" (click)="cambiarTab('medidas')"><app-icono nombre="regla" [tam]="15" /> Medir</button>
          </div>
        </div>

        <div class="ficha-kpis">
          <div class="kpi">
            <span class="k-ico"><app-icono nombre="balanza" [tam]="16" /></span>
            <div>
              <div class="k-lbl">Peso actual</div>
              <div class="k-val">{{ resumen().peso }}</div>
              @if (resumen().cambioPeso; as c) { <div class="k-sub"><span [class]="c.cls">{{ c.txt }} {{ u.uPeso() }}</span> desde el inicio</div> }
              @else { <div class="k-sub">{{ resumen().ultimaMedicion }}</div> }
            </div>
          </div>
          <div class="kpi">
            <span class="k-ico k-fuego"><app-icono nombre="fuego" [tam]="16" /></span>
            <div>
              <div class="k-lbl">Racha</div>
              <div class="k-val">{{ resumen().racha }}</div>
              <div class="k-sub">entrenos seguidos</div>
            </div>
          </div>
          <div class="kpi">
            <span class="k-ico k-azul"><app-icono nombre="calendario" [tam]="16" /></span>
            <div>
              <div class="k-lbl">Asistencia del mes</div>
              <div class="k-val">{{ resumen().asistenciaMes }}</div>
              <div class="k-sub">{{ resumen().entrenosMes }} entrenos marcados</div>
            </div>
          </div>
          <div class="kpi" [class.kpi-alerta]="resumen().pagoVencido">
            <span class="k-ico" [class.k-rojo]="resumen().pagoVencido" [class.k-verde]="!resumen().pagoVencido"><app-icono nombre="dinero" [tam]="16" /></span>
            <div>
              <div class="k-lbl">Próximo pago</div>
              <div class="k-val">{{ resumen().pago }}</div>
              <div class="k-sub">{{ resumen().pagoEstado }}</div>
            </div>
          </div>
        </div>
      </section>

      <nav class="tabs-ficha" role="tablist">
        @for (t of tabs; track t[0]) {
          <button class="tab-ficha" role="tab" [attr.aria-selected]="tabActual() === t[0]" [class.activa]="tabActual() === t[0]" (click)="cambiarTab(t[0])">
            <app-icono [nombre]="t[1]" [tam]="17" /><span>{{ t[2] }}</span>
          </button>
        }
      </nav>

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
        <span class="ic"><app-icono nombre="lupa" [tam]="40" /></span>
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
  protected readonly ui = inject(UiService);
  protected readonly u = inject(UnidadesService);
  private readonly router = inject(Router);
  protected readonly tabs = TABS;
  protected readonly comp = nombreComposicion;
  protected readonly obj = nombreObjetivo;
  protected readonly ini = iniciales;
  protected icoObjetivo(o: string) { return ICONO_OBJETIVO[o] ?? 'diana'; }

  protected readonly atleta = computed(() => this.datos.atleta(this.id()));
  protected readonly tabActual = computed(() => {
    const t = this.tab();
    return t && TABS.some((x) => x[0] === t) ? t : 'perfil';
  });

  /** Indicadores rápidos de la cabecera. */
  protected readonly resumen = computed(() => {
    const a = this.atleta()!;
    const ult = ultimaMedida(a);
    const prim = a.medidas[0];
    const mes = hoyISO().slice(0, 7);
    let e = 0, f = 0;
    Object.entries(a.asistencia).forEach(([iso, v]) => { if (iso.startsWith(mes)) { if (v === 'E') e++; else if (v === 'F') f++; } });
    const d = a.proximoPago ? diasDesde(a.proximoPago) ?? 0 : null;
    return {
      peso: ult ? this.u.pesoTxt(ult.peso) : '—',
      cambioPeso: ult && prim && a.medidas.length > 1 ? deltaPeso(a.objetivo, this.u.peso(ult.peso), this.u.peso(prim.peso)) : null,
      ultimaMedicion: ult ? 'medido el ' + fmtFecha(ult.fecha) : 'sin mediciones',
      racha: rachaActual(a),
      asistenciaMes: e + f ? Math.round((e / (e + f)) * 100) + '%' : '—',
      entrenosMes: e,
      pago: a.proximoPago ? fmtFecha(a.proximoPago) : '—',
      pagoVencido: a.activo && d !== null && d > 0,
      pagoEstado: d === null ? 'sin fecha de corte' : d > 0 ? `vencido hace ${d} día${d === 1 ? '' : 's'}` : d === 0 ? 'vence hoy' : `en ${-d} día${d === -1 ? '' : 's'}`,
    };
  });

  cambiarTab(tab: string) {
    this.router.navigate([], { queryParams: { tab }, replaceUrl: true });
  }

  saludar() {
    const a = this.atleta();
    if (a && !abrirWhatsApp(a, 'Hola ' + primerNombre(a.nombre) + ' 👋 ')) {
      this.ui.toast('Este atleta no tiene teléfono. Agrégalo en Editar', 'err');
    }
  }
}
