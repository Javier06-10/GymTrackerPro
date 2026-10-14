import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { GRUPOS_MUSCULARES } from '../../../core/catalogo';
import { DatosService } from '../../../core/datos.service';
import { DIAS } from '../../../core/dominio';
import { Atleta, EjercicioCatalogo, EjercicioRutina, RegistroPeso, Rutina } from '../../../core/modelos';
import { UiService } from '../../../core/ui.service';
import { abrirWhatsApp, primerNombre } from '../../../core/whatsapp';
import { fmtFecha, hoyISO, normalizar } from '../../../core/util';
import { Modal } from '../../../shared/modal';
import { Sparkline } from '../../../shared/graficas/sparkline';
import { Icono } from '../../../shared/icono';
import { UnidadesService } from '../../../core/unidades';
import { RutinasCompartidasService, diasConContenido, prepararDias } from '../../../core/rutinas-compartidas.service';

interface FilaHistorial { fecha: string; peso: string; delta: { txt: string; cls: string } }

/** Carpeta de rutinas por día con catálogo e historial de carga (portado de tabRutinas). */
@Component({
  selector: 'app-tab-rutinas',
  imports: [FormsModule, Modal, Sparkline, Icono],
  template: `
    @let a = atleta();
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
      <div class="nota-info" style="flex:1;min-width:240px;">
        Escribe el nombre de un ejercicio o de un músculo (ej. "sentadilla", "cuádriceps", "glúteo", "pecho") y el buscador te mostrará
        todas las variantes agrupadas. El botón de la gráfica abre el historial de carga de cada ejercicio.
      </div>
      <button class="btn btn-suave" (click)="enviarWhatsApp()"><app-icono nombre="chat" [tam]="16" /> Enviar rutina</button>
      <button class="btn btn-suave" (click)="abrirCompartir()"><app-icono nombre="compartir" [tam]="16" /> Compartir rutina</button>
    </div>

    <div class="grid-dias">
      @for (dia of dias; track dia) {
        @let r = a.rutina[dia];
        <div class="card-dia">
          <div class="cab">
            <span class="dia">{{ dia }}</span>
            <input type="text" placeholder="Ej. Pierna / Glúteo" [value]="r.titulo" (change)="guardarTitulo(dia, $any($event.target).value)" />
          </div>
          <div class="cuerpo-dia">
            @if (!r.ejercicios.length && formDia() !== dia) {
              <div class="dia-descanso">Sin ejercicios · día libre o descanso</div>
            }
            @for (ej of r.ejercicios; track $index; let i = $index) {
              <div class="ejercicio-item" [style.border-color]="enEdicion(dia, i) ? 'var(--ambar)' : null" [style.opacity]="enEdicion(dia, i) ? 0.55 : null">
                <div class="fila1">
                  <span class="nom">{{ ej.nombre }}</span>
                  <button class="btn-x" title="Editar ejercicio" style="color:var(--texto-suave);" (click)="editar(dia, i)"><app-icono nombre="editar" [tam]="15" /></button>
                  <button class="btn-x" title="Historial de carga" [style.color]="histAbierto(dia, i) ? 'var(--ambar)' : 'var(--acero)'" (click)="toggleHist(dia, i)"><app-icono nombre="grafico" [tam]="15" /></button>
                  <button class="btn-x" (click)="quitar(dia, i)"><app-icono nombre="cerrar" [tam]="15" /></button>
                </div>
                <div class="specs">
                  <span>Series: <b>{{ ej.series || '—' }}</b></span>
                  <span class="peso-wrap">Peso: <input class="peso-inline" type="text" [value]="ej.peso" placeholder="—"
                    (change)="actualizarPeso(dia, i, $any($event.target).value)" /></span>
                  <span>Descanso: <b>{{ ej.descanso || '—' }}</b></span>
                </div>
                @if (ej.notas) { <div class="nota"><app-icono nombre="pin" [tam]="13" /> {{ ej.notas }}</div> }
                @if (histAbierto(dia, i)) {
                  <div class="hist-peso">
                    @let filas = historial(ej.historialPeso);
                    @if (!filas.length) {
                      <div class="hist-vacio">Sin historial todavía — registra un peso de trabajo para empezar la progresión.</div>
                    } @else {
                      <div class="hist-titulo"><app-icono nombre="tendencia" [tam]="13" /> Carga progresiva</div>
                      <app-sparkline [registros]="ej.historialPeso" />
                      @for (f of filas; track $index) {
                        <div class="hist-fila"><span>{{ fecha(f.fecha) }}</span><b>{{ f.peso }}</b><span [class]="f.delta.cls">{{ f.delta.txt }}</span></div>
                      }
                    }
                  </div>
                }
              </div>
            }

            @if (formDia() === dia) {
              <div class="ejercicio-item" style="border-color:var(--ambar);">
                @if (editando()) {
                  <div style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ambar);margin-bottom:8px;"><app-icono nombre="editar" [tam]="13" /> Editando ejercicio</div>
                }
                <div class="campo auto-wrap" style="margin-bottom:8px;">
                  <label>Ejercicio</label>
                  <input type="text" placeholder="Buscar: sentadilla, cuádriceps, glúteo, pecho..." autocomplete="off"
                    [(ngModel)]="form.nombre" (focus)="sugerir.set(true)" (blur)="sugerir.set(false)" (ngModelChange)="sugerir.set(true)" />
                  @if (sugerir() && form.nombre.trim()) {
                    <div class="auto-lista">
                      @for (g of sugerencias(); track g.clave) {
                        <div class="auto-grupo">{{ g.clave }}</div>
                        @for (ej of g.items; track ej.id) {
                          <div class="auto-item" (mousedown)="elegir(ej.nombre)">{{ ej.nombre }}<small>{{ ej.musculos.slice(0, 3).join(', ') }}</small></div>
                        }
                      }
                      @if (!existeExacto()) {
                        <div class="auto-crear" (mousedown)="abrirNuevoEjercicio()"><app-icono nombre="mas" [tam]="14" /> Crear "{{ form.nombre.trim() }}" en el catálogo</div>
                      }
                    </div>
                  }
                </div>
                <div class="fila-doble" style="margin-bottom:8px;">
                  <div class="campo"><label>Series x Reps</label><input type="text" placeholder="Ej. 4 x 10-12" [(ngModel)]="form.series" /></div>
                  <div class="campo"><label>Peso de trabajo</label><input type="text" [placeholder]="'Ej. ' + (unidades.metrico() ? '27 kg' : '60 lb')" [(ngModel)]="form.peso" /></div>
                  <div class="campo"><label>Descanso</label><input type="text" placeholder="Ej. 90 seg" [(ngModel)]="form.descanso" /></div>
                </div>
                <div class="campo" style="margin-bottom:10px;">
                  <label>Notas del ejercicio</label>
                  <input type="text" placeholder='Ej. "Bajar hasta romper el paralelo, cuidar la lumbar"' [(ngModel)]="form.notas" />
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                  <button class="btn btn-fantasma btn-mini" (click)="cancelarForm()">Cancelar</button>
                  <button class="btn btn-primario btn-mini" (click)="guardarEjercicio(dia)">{{ editando() ? 'Guardar cambios' : 'Agregar' }}</button>
                </div>
              </div>
            } @else {
              <button class="btn btn-suave btn-mini" style="align-self:flex-start;" (click)="abrirForm(dia)"><app-icono nombre="mas" [tam]="14" /> Ejercicio</button>
            }
          </div>
        </div>
      }
    </div>

    @if (nuevoEjercicio(); as nombre) {
      <app-modal titulo="Nuevo Ejercicio" (cerrar)="nuevoEjercicio.set(null)">
        <p style="color:var(--texto-suave);font-size:13.5px;">
          Se agregará <b style="color:var(--ambar)">"{{ nombre }}"</b> a tu catálogo para que aparezca en futuras búsquedas.
        </p>
        <div class="campo"><label>Grupo muscular</label>
          <select [(ngModel)]="grupoNuevo">@for (g of gruposMusculares; track g) { <option>{{ g }}</option> }</select>
        </div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="nuevoEjercicio.set(null)">Cancelar</button>
          <button class="btn btn-primario" (click)="confirmarNuevoEjercicio(nombre)">Agregar al catálogo</button>
        </ng-container>
      </app-modal>
    }

    @if (compartir()) {
      <app-modal titulo="Compartir Rutina" (cerrar)="compartir.set(false)">
        <div class="segmentado segmentado-ancho" role="group" aria-label="Con quién compartir">
          <button [class.activo]="modo() === 'atletas'" (click)="modo.set('atletas')"><app-icono nombre="usuarios" [tam]="15" /> A mis atletas</button>
          <button [class.activo]="modo() === 'entrenador'" (click)="modo.set('entrenador')"><app-icono nombre="enviar" [tam]="15" /> A otro entrenador</button>
        </div>
        @if (modo() === 'entrenador') {
          <div class="campo"><label>¿Qué enviar de {{ a.nombre }}?</label>
            <select [(ngModel)]="cr.dia">
              <option value="__todos__">Toda la semana ({{ diasConEjercicios() }} día{{ diasConEjercicios() === 1 ? '' : 's' }} con ejercicios)</option>
              @for (d of dias; track d) {
                <option [value]="d">{{ d }}{{ a.rutina[d].titulo ? ' — ' + a.rutina[d].titulo : '' }} ({{ a.rutina[d].ejercicios.length }} ej.)</option>
              }
            </select>
          </div>
          <div class="campo"><label>Correo del entrenador</label>
            <input type="email" [(ngModel)]="env.email" placeholder="Ej. coach@gmail.com" autocomplete="off" /></div>
          <div class="campo"><label>Nombre de la rutina</label>
            <input type="text" [(ngModel)]="env.nombre" maxlength="120" placeholder="Ej. Glúteo y pierna · 4 días" /></div>
          <div class="campo"><label>Nota (opcional)</label>
            <textarea [(ngModel)]="env.nota" maxlength="500" rows="2" placeholder="Ej. Ideal para principiantes, subir carga cada 2 semanas"></textarea></div>
          <label style="display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--texto-suave);cursor:pointer;">
            <input type="checkbox" [(ngModel)]="cr.pesos" style="width:16px;height:16px;accent-color:var(--ambar);" />
            Incluir los pesos de trabajo
          </label>
          <div class="nota-info">El entrenador debe tener cuenta en GymTracker Pro con ese correo. La recibirá en su panel, en <b>Rutinas recibidas</b>, y decide a qué atletas aplicarla. No se envían datos de {{ a.nombre }}: solo los ejercicios.</div>
        } @else if (!otros().length) {
          <p style="color:var(--texto-suave);font-size:14px;">No hay otros atletas registrados a quienes copiarles la rutina. Crea otro atleta primero.</p>
        } @else {
          <div class="campo"><label>¿Qué copiar de {{ a.nombre }}?</label>
            <select [(ngModel)]="cr.dia">
              <option value="__todos__">Toda la semana ({{ diasConEjercicios() }} día{{ diasConEjercicios() === 1 ? '' : 's' }} con ejercicios)</option>
              @for (d of dias; track d) {
                <option [value]="d">{{ d }}{{ a.rutina[d].titulo ? ' — ' + a.rutina[d].titulo : '' }} ({{ a.rutina[d].ejercicios.length }} ej.)</option>
              }
            </select>
          </div>
          <div class="campo"><label>Copiar a estos atletas</label>
            <div class="lista-destinos">
              @for (o of otros(); track o.id) {
                <label class="destino-item">
                  <input type="checkbox" [checked]="cr.destinos.has(o.id)" (change)="alternarDestino(o.id)" />
                  <span>{{ o.nombre }}</span>
                  <span class="chip" [class.chip-verde]="o.activo" [class.chip-gris]="!o.activo" style="margin-left:auto;">{{ o.activo ? 'Activo' : 'Inactivo' }}</span>
                </label>
              }
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--texto-suave);cursor:pointer;">
            <input type="checkbox" [(ngModel)]="cr.pesos" style="width:16px;height:16px;accent-color:var(--ambar);" />
            Incluir los pesos de trabajo (si no, se copian vacíos para personalizarlos)
          </label>
          <div class="nota-info">La rutina copiada <b>sobrescribe</b> los días seleccionados en el atleta de destino. El historial de carga no se copia: cada atleta arranca el suyo.</div>
        }
        <ng-container pie>
          @if (modo() === 'entrenador') {
            <button class="btn btn-fantasma" (click)="compartir.set(false)">Cancelar</button>
            <button class="btn btn-primario" (click)="enviarAEntrenador()" [disabled]="enviando()"><app-icono nombre="enviar" [tam]="15" /> {{ enviando() ? 'Enviando…' : 'Enviar rutina' }}</button>
          } @else {
            <button class="btn btn-fantasma" (click)="compartir.set(false)">{{ otros().length ? 'Cancelar' : 'Entendido' }}</button>
            @if (otros().length) { <button class="btn btn-primario" (click)="ejecutarCompartir()"><app-icono nombre="compartir" [tam]="15" /> Copiar rutina</button> }
          }
        </ng-container>
      </app-modal>
    }
  `,
})
export class TabRutinas {
  readonly atleta = input.required<Atleta>();
  private readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);
  protected readonly unidades = inject(UnidadesService);

  protected readonly dias = DIAS;
  protected readonly fecha = fmtFecha;
  protected readonly gruposMusculares = GRUPOS_MUSCULARES;

  protected readonly formDia = signal<string | null>(null);
  protected readonly editando = signal<{ dia: string; indice: number } | null>(null);
  protected readonly histAbiertos = signal(new Set<string>());
  protected readonly sugerir = signal(false);
  protected form = { nombre: '', series: '', peso: '', descanso: '', notas: '' };

  private clonar(): Rutina {
    return structuredClone(this.atleta().rutina);
  }

  private async guardarRutina(rutina: Rutina, msg?: string) {
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { rutina });
      if (msg) this.ui.toast(msg);
      return true;
    } catch (e) {
      this.ui.error(e);
      return false;
    }
  }

  enEdicion(dia: string, i: number) {
    const e = this.editando();
    return !!e && e.dia === dia && e.indice === i;
  }

  /* ---------- Historial de carga ---------- */
  histAbierto(dia: string, i: number) {
    return this.histAbiertos().has(dia + '|' + i);
  }
  toggleHist(dia: string, i: number) {
    const k = dia + '|' + i;
    const s = new Set(this.histAbiertos());
    s.has(k) ? s.delete(k) : s.add(k);
    this.histAbiertos.set(s);
  }
  historial(hp: RegistroPeso[]): FilaHistorial[] {
    return hp
      .map((reg, i) => {
        const ant = i > 0 ? hp[i - 1] : null;
        let delta = { txt: 'inicio', cls: 'delta-cero' };
        if (ant) {
          const x = parseFloat(String(reg.peso).replace(',', '.'));
          const y = parseFloat(String(ant.peso).replace(',', '.'));
          if (!isNaN(x) && !isNaN(y)) {
            const d = Math.round((x - y) * 10) / 10;
            delta = d > 0 ? { txt: '▲ +' + d, cls: 'delta-pos' } : d < 0 ? { txt: '▼ ' + d, cls: 'delta-neg' } : { txt: '=', cls: 'delta-cero' };
          } else delta = { txt: '', cls: '' };
        }
        return { fecha: reg.fecha, peso: reg.peso, delta };
      })
      .reverse();
  }

  /* ---------- Formulario de ejercicio ---------- */
  abrirForm(dia: string) {
    this.editando.set(null);
    this.form = { nombre: '', series: '', peso: '', descanso: '', notas: '' };
    this.formDia.set(dia);
  }

  editar(dia: string, i: number) {
    const ej = this.atleta().rutina[dia].ejercicios[i];
    this.form = { nombre: ej.nombre, series: ej.series, peso: ej.peso, descanso: ej.descanso, notas: ej.notas };
    this.editando.set({ dia, indice: i });
    this.formDia.set(dia);
  }

  cancelarForm() {
    this.formDia.set(null);
    this.editando.set(null);
  }

  /* ---------- Autocompletado agrupado por Grupo · Familia ---------- */
  protected sugerencias(): { clave: string; items: EjercicioCatalogo[] }[] {
    const grupos = new Map<string, EjercicioCatalogo[]>();
    this.datos.buscarEjercicios(this.form.nombre).forEach((ej) => {
      const clave = `${ej.grupo} · ${ej.familia}`;
      grupos.set(clave, [...(grupos.get(clave) ?? []), ej]);
    });
    return [...grupos.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([clave, items]) => ({ clave, items }));
  }
  protected existeExacto() {
    const q = normalizar(this.form.nombre.trim());
    return this.datos.catalogo().some((ej) => normalizar(ej.nombre) === q);
  }
  elegir(nombre: string) {
    this.form.nombre = nombre;
    this.sugerir.set(false);
  }

  protected readonly nuevoEjercicio = signal<string | null>(null);
  protected grupoNuevo = 'Pierna';
  abrirNuevoEjercicio() {
    this.grupoNuevo = 'Pierna';
    this.nuevoEjercicio.set(this.form.nombre.trim());
  }
  async confirmarNuevoEjercicio(nombre: string) {
    try {
      await this.datos.crearEjercicio(nombre, this.grupoNuevo);
      this.form.nombre = nombre;
      this.nuevoEjercicio.set(null);
      this.ui.toast(`"${nombre}" agregado al catálogo ✓`);
    } catch (e) {
      this.ui.error(e);
    }
  }

  async guardarEjercicio(dia: string) {
    const nombre = this.form.nombre.trim();
    if (!nombre) return this.ui.toast('Escribe o selecciona el ejercicio', 'err');
    const rutina = this.clonar();
    const pesoIni = this.form.peso.trim();
    const ed = this.editando();
    if (ed && ed.dia === dia) {
      // Guardar cambios conservando el historial
      const ej = rutina[dia].ejercicios[ed.indice];
      ej.nombre = nombre;
      ej.series = this.form.series.trim();
      ej.descanso = this.form.descanso.trim();
      ej.notas = this.form.notas.trim();
      if (pesoIni !== ej.peso) {
        ej.peso = pesoIni;
        if (pesoIni) this.registrarPeso(ej, pesoIni);
      }
      if (await this.guardarRutina(rutina, 'Ejercicio actualizado ✓')) this.cancelarForm();
      return;
    }
    rutina[dia].ejercicios.push({
      nombre,
      series: this.form.series.trim(),
      peso: pesoIni,
      descanso: this.form.descanso.trim(),
      notas: this.form.notas.trim(),
      historialPeso: pesoIni ? [{ fecha: hoyISO(), peso: pesoIni }] : [],
    });
    if (await this.guardarRutina(rutina, 'Ejercicio agregado ✓')) this.cancelarForm();
  }

  /** Varias ediciones el mismo día = 1 registro. */
  private registrarPeso(ej: EjercicioRutina, peso: string) {
    const hoy = hoyISO();
    const ultimo = ej.historialPeso[ej.historialPeso.length - 1];
    if (ultimo && ultimo.fecha === hoy) ultimo.peso = peso;
    else if (!ultimo || ultimo.peso !== peso) ej.historialPeso.push({ fecha: hoy, peso });
  }

  async actualizarPeso(dia: string, i: number, valor: string) {
    const rutina = this.clonar();
    const ej = rutina[dia].ejercicios[i];
    ej.peso = valor.trim();
    if (ej.peso) this.registrarPeso(ej, ej.peso);
    await this.guardarRutina(rutina, 'Peso de trabajo actualizado ✓ (guardado en el historial)');
  }

  async guardarTitulo(dia: string, valor: string) {
    const rutina = this.clonar();
    rutina[dia].titulo = valor.trim();
    await this.guardarRutina(rutina);
  }

  async quitar(dia: string, i: number) {
    const rutina = this.clonar();
    rutina[dia].ejercicios.splice(i, 1);
    if (this.editando()?.dia === dia) this.cancelarForm();
    this.histAbiertos.set(new Set());
    await this.guardarRutina(rutina);
  }

  /* ---------- Compartir rutina con otros atletas ---------- */
  protected readonly compartir = signal(false);
  protected cr = { dia: '__todos__', destinos: new Set<string>(), pesos: false };
  protected readonly otros = computed(() => this.datos.atletas().filter((x) => x.id !== this.atleta().id));
  protected readonly diasConEjercicios = computed(() => DIAS.filter((d) => this.atleta().rutina[d].ejercicios.length).length);

  abrirCompartir() {
    this.cr = { dia: '__todos__', destinos: new Set(), pesos: false };
    this.env = { email: '', nombre: this.nombreSugerido(), nota: '' };
    this.modo.set('atletas');
    this.compartir.set(true);
  }

  /* ---------- Enviar a otro entrenador ---------- */
  private readonly compartidas = inject(RutinasCompartidasService);
  protected readonly modo = signal<'atletas' | 'entrenador'>('atletas');
  protected readonly enviando = signal(false);
  protected env = { email: '', nombre: '', nota: '' };

  /** "Glúteo · Pierna · Espalda" con los títulos de los días, o "Rutina de 5 días". */
  private nombreSugerido() {
    const r = this.atleta().rutina;
    const con = DIAS.filter((d) => r[d].ejercicios.length);
    const titulos = [...new Set(con.map((d) => r[d].titulo.trim()).filter(Boolean))];
    return titulos.length ? titulos.slice(0, 3).join(' · ') : `Rutina de ${con.length} día${con.length === 1 ? '' : 's'}`;
  }

  async enviarAEntrenador() {
    const email = this.env.email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return this.ui.toast('Escribe un correo válido', 'err');
    if (!this.env.nombre.trim()) return this.ui.toast('Ponle nombre a la rutina', 'err');
    const dias = this.cr.dia === '__todos__' ? DIAS.filter((d) => this.atleta().rutina[d].ejercicios.length) : [this.cr.dia];
    const rutina = prepararDias(this.atleta().rutina, dias, this.cr.pesos);
    if (!diasConContenido(rutina).length) return this.ui.toast('Ese día no tiene ejercicios para enviar', 'err');
    this.enviando.set(true);
    try {
      const quien = await this.compartidas.enviar(email, this.env.nombre, this.env.nota, rutina);
      this.compartir.set(false);
      this.ui.toast(`Rutina enviada a ${quien} ✓`);
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.enviando.set(false);
    }
  }
  alternarDestino(id: string) {
    this.cr.destinos.has(id) ? this.cr.destinos.delete(id) : this.cr.destinos.add(id);
  }
  async ejecutarCompartir() {
    const destinos = [...this.cr.destinos];
    if (!destinos.length) return this.ui.toast('Selecciona al menos un atleta de destino', 'err');
    const dias = this.cr.dia === '__todos__' ? DIAS : [this.cr.dia];
    const copia = prepararDias(this.atleta().rutina, dias, this.cr.pesos);
    try {
      for (const idDest of destinos) {
        const dest = this.datos.atleta(idDest);
        if (!dest) continue;
        const rutina = { ...structuredClone(dest.rutina), ...structuredClone(copia) } as Rutina;
        await this.datos.actualizarAtleta(idDest, { rutina });
      }
      this.compartir.set(false);
      this.ui.toast(`Rutina copiada a ${destinos.length} atleta${destinos.length === 1 ? '' : 's'} ✓`);
    } catch (e) {
      this.ui.error(e);
    }
  }

  /* ---------- Enviar por WhatsApp ---------- */
  enviarWhatsApp() {
    const a = this.atleta();
    const nombresDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = nombresDia[new Date().getDay()];
    const textoDia = (d: string) => {
      const r = a.rutina[d];
      let t = '*' + d.toUpperCase() + (r.titulo ? ' — ' + r.titulo.toUpperCase() : '') + '*\n';
      r.ejercicios.forEach((ej, i) => {
        t += i + 1 + '. ' + ej.nombre;
        const partes: string[] = [];
        if (ej.series) partes.push(ej.series);
        if (ej.peso) partes.push(ej.peso);
        if (ej.descanso) partes.push('desc. ' + ej.descanso);
        if (partes.length) t += ' — ' + partes.join(' · ');
        t += '\n';
        if (ej.notas) t += '   📌 ' + ej.notas + '\n';
      });
      return t;
    };
    let cuerpo: string;
    if (a.rutina[hoy]?.ejercicios.length) {
      cuerpo = '🏋️ *RUTINA DE HOY*\n\n' + textoDia(hoy);
    } else {
      const conRutina = DIAS.filter((d) => a.rutina[d].ejercicios.length);
      if (!conRutina.length) return this.ui.toast('Este atleta aún no tiene rutina armada', 'err');
      cuerpo = '🏋️ *TU RUTINA DE LA SEMANA*\n\n' + conRutina.map(textoDia).join('\n');
    }
    const firma = this.auth.perfil()?.nombre ? '\n— ' + this.auth.perfil()!.nombre : '';
    if (!abrirWhatsApp(a, 'Hola ' + primerNombre(a.nombre) + ' 👋\n\n' + cuerpo + '\n¡Nos vemos en el gym! 💪' + firma)) {
      this.ui.toast('Este atleta no tiene teléfono. Agrégalo en Editar', 'err');
    }
  }
}
