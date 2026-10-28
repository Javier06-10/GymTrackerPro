import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { DIAS, rachaActual } from '../../core/dominio';
import { Atleta, DiaRutina, EstadoAsistencia } from '../../core/modelos';
import { UiService } from '../../core/ui.service';
import { MESES_ES, hoyISO, normalizar, sumarDias } from '../../core/util';
import { AvatarIniciales } from '../../shared/avatar-iniciales';
import { Icono } from '../../shared/icono';

type Filtro = 'todos' | 'toca' | 'pendientes';

/** Día de la semana de una fecha ISO con el nombre que usa la rutina ("Lunes"…"Domingo"). */
function diaSemana(iso: string): string {
  return DIAS[(new Date(iso + 'T00:00:00').getDay() + 6) % 7];
}

/** Pasar lista de todos los atletas en una fecha, sin entrar a cada perfil. Escribe en la misma asistencia del perfil. */
@Component({
  selector: 'app-pasar-lista',
  imports: [FormsModule, RouterLink, AvatarIniciales, Icono],
  template: `
    <a class="volver" routerLink="/panel">← Volver al panel</a>
    <section class="cab-pagina">
      <div class="cab-ico"><app-icono nombre="calendario" [tam]="24" /></div>
      <div class="cab-texto">
        <h1>Pasar lista</h1>
        <p>Marca quién entrenó y quién faltó sin entrar al perfil de cada atleta.</p>
      </div>
    </section>

    @if (!auth.vigente()) {
      <div class="aviso aviso-rojo" style="margin-bottom:14px;"><app-icono nombre="prohibido" [tam]="16" /> <span>Tu suscripción no está vigente: puedes ver la lista, pero no marcar asistencia.</span></div>
    }

    <div class="tarjeta pl-fecha">
      <button class="btn btn-suave btn-mini" (click)="moverDia(-1)" aria-label="Día anterior"><app-icono nombre="chevron" [tam]="16" style="transform:rotate(180deg)" /></button>
      <div class="pl-fecha-centro">
        <div class="pl-dia">{{ diaNombre() }}{{ esHoy() ? ' · Hoy' : '' }}</div>
        <div class="pl-fecha-txt">{{ fechaLarga() }}</div>
      </div>
      <button class="btn btn-suave btn-mini" (click)="moverDia(1)" [disabled]="esHoy()" aria-label="Día siguiente"><app-icono nombre="chevron" [tam]="16" /></button>
      <input type="date" class="pl-selector" [max]="hoy" [ngModel]="fecha()" (ngModelChange)="elegirFecha($event)" aria-label="Elegir fecha" />
      @if (!esHoy()) { <button class="btn btn-fantasma btn-mini" (click)="fecha.set(hoy)">Ir a hoy</button> }
    </div>

    <div class="pl-resumen">
      <div class="pl-cifra pl-e"><b>{{ conteo().e }}</b> entrenaron</div>
      <div class="pl-cifra pl-f"><b>{{ conteo().f }}</b> faltaron</div>
      <div class="pl-cifra"><b>{{ conteo().p }}</b> sin marcar</div>
    </div>

    <div class="barra-busqueda">
      <div class="campo-buscar"><span class="lupa"><app-icono nombre="lupa" [tam]="16" /></span>
        <input type="text" placeholder="Buscar atleta..." [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" /></div>
      @if (datos.grupos().length) {
        <select class="pl-grupo" [ngModel]="grupo()" (ngModelChange)="grupo.set($event)" aria-label="Grupo">
          <option value="">Todos los grupos</option>
          @for (g of datos.grupos(); track g.id) { <option [value]="g.id">{{ g.nombre }}</option> }
        </select>
      }
      <div class="filtros-grupo" style="margin:0;">
        <div class="chip-filtro" [class.activo]="filtro() === 'todos'" (click)="filtro.set('todos')">Todos ({{ base().length }})</div>
        <div class="chip-filtro" [class.activo]="filtro() === 'toca'" (click)="filtro.set('toca')" title="Tienen ejercicios en su rutina para este día">Les toca el {{ diaNombre().toLowerCase() }} ({{ conRutina() }})</div>
        <div class="chip-filtro" [class.activo]="filtro() === 'pendientes'" (click)="filtro.set('pendientes')">Sin marcar ({{ conteo().p }})</div>
      </div>
    </div>

    @if (visibles().length) {
      <div class="pl-masivo">
        <span>{{ visibles().length }} atleta{{ visibles().length === 1 ? '' : 's' }} en la lista</span>
        <button class="btn btn-suave btn-mini" (click)="marcarPendientes('E')" [disabled]="!auth.vigente() || !pendientesVisibles().length || ocupado()"><app-icono nombre="check" [tam]="14" /> Pendientes: entrenaron</button>
        <button class="btn btn-suave btn-mini" (click)="marcarPendientes('F')" [disabled]="!auth.vigente() || !pendientesVisibles().length || ocupado()"><app-icono nombre="cerrar" [tam]="14" /> Pendientes: faltaron</button>
      </div>
    }

    <div class="pl-lista">
      @for (a of visibles(); track a.id) {
        @let est = a.asistencia[fecha()];
        @let dia = diaRutina(a);
        <div class="pl-fila" [class.es-e]="est === 'E'" [class.es-f]="est === 'F'">
          <a class="pl-atleta" [routerLink]="['/atletas', a.id]" [queryParams]="{ tab: 'asistencia' }" title="Abrir perfil">
            <app-avatar-iniciales [nombre]="a.nombre" [genero]="a.genero" [tam]="40" />
            <div class="pl-info">
              <div class="pl-nombre">{{ a.nombre }}</div>
              <div class="pl-sub">
                {{ nombreGrupo(a.grupoId) }}
                @if (dia) { · <span class="pl-toca"><app-icono nombre="pesa" [tam]="12" /> {{ dia.titulo || 'Le toca entrenar' }}</span> }
                @if (racha(a); as r) { · <span class="pl-racha"><app-icono nombre="fuego" [tam]="12" /> {{ r }}</span> }
              </div>
              <div class="pl-semana" aria-label="Últimos 7 días">
                @for (d of semana(); track d) {
                  <span class="pl-punto" [class.e]="a.asistencia[d] === 'E'" [class.f]="a.asistencia[d] === 'F'" [class.actual]="d === fecha()" [title]="d"></span>
                }
              </div>
            </div>
          </a>
          <div class="pl-botones" role="group" [attr.aria-label]="'Asistencia de ' + a.nombre">
            <button class="pl-btn pl-btn-e" [class.activo]="est === 'E'" (click)="marcar(a, 'E')" [disabled]="!auth.vigente() || guardando().has(a.id)" [attr.aria-pressed]="est === 'E'">
              <app-icono nombre="check" [tam]="16" /><span>Entrenó</span>
            </button>
            <button class="pl-btn pl-btn-f" [class.activo]="est === 'F'" (click)="marcar(a, 'F')" [disabled]="!auth.vigente() || guardando().has(a.id)" [attr.aria-pressed]="est === 'F'">
              <app-icono nombre="cerrar" [tam]="16" /><span>Faltó</span>
            </button>
          </div>
        </div>
      } @empty {
        <div class="vacio" style="padding:30px;">
          <p>{{ base().length ? 'Ningún atleta coincide con el filtro.' : 'No tienes atletas activos.' }}</p>
        </div>
      }
    </div>
    <p class="pl-nota">Toca de nuevo un botón marcado para quitar la marca. Solo se muestran atletas activos.</p>
  `,
})
export class PasarLista {
  protected readonly auth = inject(AuthService);
  protected readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);

  protected readonly hoy = hoyISO();
  protected readonly fecha = signal(this.hoy);
  protected readonly busqueda = signal('');
  protected readonly grupo = signal('');
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly guardando = signal<Set<string>>(new Set());
  protected readonly ocupado = signal(false);

  protected readonly esHoy = computed(() => this.fecha() === this.hoy);
  protected readonly diaNombre = computed(() => diaSemana(this.fecha()));
  protected readonly fechaLarga = computed(() => {
    const [a, m, d] = this.fecha().split('-').map(Number);
    return `${d} de ${MESES_ES[m - 1].toLowerCase()} de ${a}`;
  });
  /** Los 7 días que terminan en la fecha elegida. */
  protected readonly semana = computed(() => Array.from({ length: 7 }, (_, i) => sumarDias(this.fecha(), i - 6)));

  /** Atletas activos del grupo elegido. */
  protected readonly base = computed(() =>
    this.datos.atletas().filter((a) => a.activo && (!this.grupo() || a.grupoId === this.grupo())),
  );
  protected readonly conRutina = computed(() => this.base().filter((a) => this.diaRutina(a)).length);
  protected readonly conteo = computed(() => {
    const f = this.fecha();
    let e = 0, x = 0;
    this.base().forEach((a) => (a.asistencia[f] === 'E' ? e++ : a.asistencia[f] === 'F' ? x++ : 0));
    return { e, f: x, p: this.base().length - e - x };
  });
  protected readonly visibles = computed(() => {
    const q = normalizar(this.busqueda());
    const f = this.fecha();
    return this.base().filter(
      (a) =>
        (!q || normalizar(a.nombre).includes(q)) &&
        (this.filtro() !== 'toca' || this.diaRutina(a)) &&
        (this.filtro() !== 'pendientes' || !a.asistencia[f]),
    );
  });
  protected readonly pendientesVisibles = computed(() => this.visibles().filter((a) => !a.asistencia[this.fecha()]));

  diaRutina(a: Atleta): DiaRutina | null {
    const d = a.rutina?.[diaSemana(this.fecha())] as DiaRutina | undefined;
    return d?.ejercicios?.length ? d : null;
  }
  nombreGrupo(id: string) {
    return this.datos.grupos().find((g) => g.id === id)?.nombre ?? 'Sin grupo';
  }
  racha(a: Atleta) {
    const r = rachaActual(a);
    return r >= 2 ? r : 0;
  }

  moverDia(n: number) {
    const nueva = sumarDias(this.fecha(), n);
    if (nueva <= this.hoy) this.fecha.set(nueva);
  }
  elegirFecha(v: string) {
    if (v && v <= this.hoy) this.fecha.set(v);
  }

  private async guardar(a: Atleta, estado: EstadoAsistencia | null, f: string) {
    const asistencia = { ...a.asistencia };
    if (estado) asistencia[f] = estado;
    else delete asistencia[f];
    await this.datos.actualizarAtleta(a.id, { asistencia });
  }

  /** Marca o desmarca (si ya tenía esa misma marca). */
  async marcar(a: Atleta, estado: EstadoAsistencia) {
    const f = this.fecha();
    const nuevo = a.asistencia[f] === estado ? null : estado;
    this.guardando.update((s) => new Set(s).add(a.id));
    try {
      await this.guardar(a, nuevo, f);
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardando.update((s) => {
        const n = new Set(s);
        n.delete(a.id);
        return n;
      });
    }
  }

  /** Marca a todos los visibles que aún no tienen marca en esta fecha. */
  async marcarPendientes(estado: EstadoAsistencia) {
    const lista = this.pendientesVisibles();
    if (!lista.length) return;
    const uno = lista.length === 1;
    const texto = estado === 'E' ? (uno ? 'entrenó' : 'entrenaron') : uno ? 'faltó' : 'faltaron';
    const ok = await this.ui.confirmar(
      'Marcar pendientes',
      `Se marcará que <b>${lista.length} atleta${lista.length === 1 ? '' : 's'}</b> ${texto} el ${this.diaNombre().toLowerCase()} ${this.fechaLarga()}. Los que ya tienen marca no cambian.`,
      'Marcar',
    );
    if (!ok) return;
    const f = this.fecha();
    this.ocupado.set(true);
    const resultados = await Promise.allSettled(lista.map((a) => this.guardar(a, estado, f)));
    this.ocupado.set(false);
    const fallos = resultados.filter((r) => r.status === 'rejected').length;
    if (fallos) this.ui.toast(`No se pudieron guardar ${fallos} de ${lista.length}. Revisa tu conexión e intenta de nuevo.`, 'err');
    else this.ui.toast(`Listo: ${lista.length} marcado${lista.length === 1 ? '' : 's'} ✓`);
  }
}
