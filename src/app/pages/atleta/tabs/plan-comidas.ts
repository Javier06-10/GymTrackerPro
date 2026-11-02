import { Component, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { Atleta } from '../../../core/modelos';
import { EQUIVALENCIAS, TipoPlan, armarPlan, planRecomendado, planTexto } from '../../../core/planes-comida';
import { UiService } from '../../../core/ui.service';
import { abrirWhatsApp } from '../../../core/whatsapp';
import { Icono } from '../../../shared/icono';

/** Plan de comidas sugerido según el objetivo, con porciones ajustadas a las calorías del atleta. */
@Component({
  selector: 'app-plan-comidas',
  imports: [Icono],
  template: `
    @let p = plan();
    <div class="titulo-seccion"><app-icono nombre="cubiertos" [tam]="16" /> Plan de comidas sugerido</div>

    <div class="segmentado segmentado-ancho pc-tipos" role="tablist" aria-label="Tipo de plan">
      @for (t of tipos; track t.v) {
        <button role="tab" [class.activo]="tipo() === t.v" (click)="elegido.set(t.v)">
          {{ t.t }}@if (t.v === recomendado()) { <span class="pc-reco" title="Recomendado por el objetivo del atleta">★</span> }
        </button>
      }
    </div>

    <div class="tarjeta pc-cab">
      <div>
        <div class="pc-titulo">Plan de alimentación · {{ p.titulo }}</div>
        <span class="chip chip-verde">Objetivo: {{ p.objetivo.toLowerCase() }}</span>
        @if (tipo() !== recomendado()) { <span class="chip chip-gris" style="margin-left:6px;">No es el recomendado para su objetivo</span> }
      </div>
      <div class="pc-totales">
        <div><b>≈ {{ redondo10(p.kcal).toLocaleString() }}</b> kcal@if (p.meta) { <small> / meta {{ p.meta.toLocaleString() }}</small> }</div>
        <div><b>{{ redondo(p.prot) }} g</b> proteína@if (p.protMeta) { <small> / meta {{ p.protMeta[0] }}–{{ p.protMeta[1] }} g</small> }</div>
      </div>
    </div>

    <div class="pc-comidas">
      @for (c of p.comidas; track c.nombre; let i = $index) {
        <div class="pc-comida">
          <div class="pc-emoji" aria-hidden="true">{{ c.emoji }}</div>
          <div class="pc-cuerpo">
            <div class="pc-nombre">{{ i + 1 }}. {{ c.nombre }} <span>({{ c.hora }})</span></div>
            <ul>@for (it of c.items; track $index) { <li>{{ it.texto }}</li> }</ul>
            <div class="pc-macros">Proteína aproximada: <b>{{ redondo(c.prot) }} g</b> · ≈ {{ redondo10(c.kcal) }} kcal</div>
          </div>
        </div>
      }
    </div>

    <div class="pc-acciones">
      <button class="btn btn-primario" (click)="enviar()" [disabled]="!atleta().telefono"><app-icono nombre="chat" [tam]="16" /> Enviar por WhatsApp</button>
      <button class="btn btn-suave" (click)="copiar()"><app-icono nombre="documento" [tam]="16" /> Copiar texto</button>
      @if (!atleta().telefono) { <span class="pc-sin-tel">Agrega el teléfono del atleta para enviarlo por WhatsApp.</span> }
    </div>

    <details class="pc-equiv">
      <summary><app-icono nombre="recargar" [tam]="15" /> Equivalencias para variar el menú</summary>
      @for (e of equivalencias; track e[0]) { <div class="pc-eq"><b>{{ e[0] }}:</b> {{ e[1] }}</div> }
    </details>

    <div class="nota-info" style="margin-top:12px;">
      @if (p.meta) {
        Las porciones de gramos y unidades se ajustaron a las calorías estimadas del atleta ({{ p.meta.toLocaleString() }} kcal). Los valores son aproximados.
      } @else {
        Plantilla base sin ajustar: completa la <b>edad</b> y una <b>medición con peso</b> para adaptar las porciones al atleta.
      }
      Es un ejemplo orientativo y no sustituye la valoración de un nutricionista, sobre todo si hay condiciones médicas o alergias.
    </div>
  `,
})
export class PlanComidas {
  readonly atleta = input.required<Atleta>();
  private readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);

  protected readonly tipos: { v: TipoPlan; t: string }[] = [
    { v: 'deficit', t: 'Déficit' }, { v: 'mantenimiento', t: 'Mantenimiento' }, { v: 'superavit', t: 'Superávit' },
  ];
  protected readonly equivalencias = EQUIVALENCIAS;
  protected readonly redondo = Math.round;
  protected redondo10(v: number) { return Math.round(v / 10) * 10; }

  /** Elección manual del entrenador; si no eligió, se usa la recomendada. */
  protected readonly elegido = signal<TipoPlan | null>(null);
  protected readonly recomendado = computed(() => planRecomendado(this.atleta()));
  protected readonly tipo = computed(() => this.elegido() ?? this.recomendado());
  protected readonly plan = computed(() => armarPlan(this.atleta(), this.tipo()));

  private texto() {
    const per = this.auth.perfil();
    return planTexto(this.plan(), this.atleta().nombre, per?.nombre || per?.negocio || '');
  }

  enviar() {
    if (!abrirWhatsApp(this.atleta(), this.texto())) this.ui.toast('El teléfono del atleta no es válido para WhatsApp', 'err');
  }

  async copiar() {
    try {
      await navigator.clipboard.writeText(this.texto());
      this.ui.toast('Plan copiado ✓');
    } catch {
      this.ui.toast('No se pudo copiar en este navegador', 'err');
    }
  }
}

