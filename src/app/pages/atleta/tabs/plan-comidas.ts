import { Component, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { PdfService } from '../../../core/pdf.service';
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
      <button class="btn btn-primario" (click)="compartirPdf()" [disabled]="generando()" title="En el teléfono abre el menú para mandarlo por WhatsApp; en la computadora lo descarga">
        <app-icono nombre="compartir" [tam]="16" /> {{ generando() ? 'Generando…' : 'Compartir PDF' }}
      </button>
      <button class="btn btn-suave" (click)="descargarPdf()" [disabled]="generando()"><app-icono nombre="descargar" [tam]="16" /> Descargar PDF</button>
      <button class="btn btn-suave" (click)="enviar()" [disabled]="!atleta().telefono"><app-icono nombre="chat" [tam]="16" /> Enviar texto por WhatsApp</button>
      <button class="btn btn-fantasma" (click)="copiar()"><app-icono nombre="documento" [tam]="16" /> Copiar texto</button>
    </div>
    @if (!atleta().telefono) { <div class="pc-sin-tel">Agrega el teléfono del atleta para enviarle el texto directo a su WhatsApp.</div> }

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
  private readonly pdf = inject(PdfService);
  protected readonly generando = signal(false);

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

  async descargarPdf() {
    this.generando.set(true);
    try {
      await this.pdf.planComidas(this.atleta(), this.plan());
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.generando.set(false);
    }
  }

  /** En el teléfono abre el menú de compartir con el PDF adjunto (WhatsApp, correo…); si no se puede, lo descarga. */
  async compartirPdf() {
    this.generando.set(true);
    try {
      const nombre = this.atleta().nombre.split(' ')[0];
      const r = await this.pdf.compartirPlanComidas(this.atleta(), this.plan(), `Hola ${nombre} 👋 Te comparto tu plan de alimentación.`);
      if (r === 'descargado') this.ui.toast('PDF descargado. Adjúntalo en el chat de WhatsApp del atleta.');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.generando.set(false);
    }
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

