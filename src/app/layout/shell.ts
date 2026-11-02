import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DatosService } from '../core/datos.service';
import { PwaService } from '../core/pwa.service';
import { RutinasCompartidasService } from '../core/rutinas-compartidas.service';
import { UiService } from '../core/ui.service';
import { AtletaForm } from '../pages/atleta/atleta-form';
import { Icono } from '../shared/icono';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AtletaForm, Icono],
  template: `
    <div id="app">
      <header class="top">
        <a class="logo" routerLink="/panel" style="text-decoration:none;color:inherit;">
          <div class="icono" id="logo-caja" [class.icono-fenix]="!auth.perfil()?.logo_url">
            @if (auth.perfil()?.logo_url; as logo) { <img [src]="logo" alt="logo" /> } @else { <img src="icons/fenix.svg" alt="" class="marca-fenix" /> }
          </div>
          <div>
            <h1>COACH <span>FÉNIX</span></h1>
            <small>Panel de Entrenador · {{ auth.perfil()?.negocio || auth.perfil()?.nombre }}</small>
          </div>
        </a>
        <nav class="nav-top">
          <a routerLink="/panel" routerLinkActive="activo">Panel@if (compartidas.recibidas().length) { <span class="contador" title="Rutinas recibidas">{{ compartidas.recibidas().length }}</span> }</a>
          <a routerLink="/asistencia" routerLinkActive="activo">Pasar lista</a>
          <a routerLink="/manual" routerLinkActive="activo">Manual</a>
          <a routerLink="/cuenta" routerLinkActive="activo">Mi cuenta</a>
          @if (auth.esAdmin()) { <a routerLink="/admin" routerLinkActive="activo">Admin</a> }
        </nav>
        <div class="separador"></div>
        @if (pwa.puedeOfrecer()) {
          <button class="btn btn-suave btn-txt" (click)="pwa.instalar()" title="Instalar Coach Fénix como app">
            <app-icono nombre="instalar" [tam]="16" /> Instalar app
          </button>
        }
        <button class="btn btn-primario" (click)="ui.formAtleta.set({ id: null })" [disabled]="!auth.vigente()">
          <app-icono nombre="mas" [tam]="16" /><span class="btn-txt"> Nuevo atleta</span>
        </button>
        <button class="btn btn-fantasma menu-movil" (click)="menu.set(!menu())" aria-label="Menú"><app-icono nombre="menu" [tam]="18" /></button>
        <button class="btn btn-fantasma btn-txt" (click)="salir()" title="Cerrar sesión" aria-label="Cerrar sesión"><app-icono nombre="salir" [tam]="17" /></button>
        @if (menu()) {
          <div class="menu-desplegable" (click)="menu.set(false)">
            <a routerLink="/panel"><app-icono nombre="casa" [tam]="16" /> Panel@if (compartidas.recibidas().length) { <span class="contador">{{ compartidas.recibidas().length }}</span> }</a>
            <a routerLink="/asistencia"><app-icono nombre="calendario" [tam]="16" /> Pasar lista</a>
            <a routerLink="/manual"><app-icono nombre="libro" [tam]="16" /> Manual del entrenador</a>
            <a routerLink="/cuenta"><app-icono nombre="persona" [tam]="16" /> Mi cuenta y plan</a>
            @if (auth.esAdmin()) { <a routerLink="/admin"><app-icono nombre="herramienta" [tam]="16" /> Administración</a> }
            @if (pwa.puedeOfrecer()) {
              <button class="menu-instalar" (click)="pwa.instalar()"><app-icono nombre="instalar" [tam]="16" /> Instalar la app en este teléfono</button>
            }
            <button (click)="salir()"><app-icono nombre="salir" [tam]="16" /> Cerrar sesión</button>
          </div>
        }
      </header>

      @if (banner(); as b) {
        <div class="banner-sus" [class.vencida]="b.vencida">
          <span style="display:inline-flex;align-items:center;gap:7px;"><app-icono [nombre]="b.icono || 'reloj'" [tam]="16" /> {{ b.texto }}</span>
          <a routerLink="/cuenta">Ver planes →</a>
        </div>
      }

      <main>
        @if (cargando()) {
          <div class="cargando">Cargando tus atletas…</div>
        } @else {
          <router-outlet />
        }
      </main>
    </div>

    @if (ui.formAtleta(); as f) {
      <app-atleta-form [atletaId]="f.id" (cerrar)="ui.formAtleta.set(null)" />
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly datos = inject(DatosService);
  protected readonly ui = inject(UiService);
  protected readonly pwa = inject(PwaService);
  protected readonly compartidas = inject(RutinasCompartidasService);
  private readonly router = inject(Router);
  protected readonly menu = signal(false);
  protected readonly cargando = signal(true);

  protected readonly banner = computed(() => {
    const s = this.auth.suscripcion();
    if (!s) return null;
    const d = this.auth.diasRestantes();
    if (!this.auth.vigente()) {
      return { vencida: true, icono: 'prohibido', texto: 'Tu suscripción no está vigente. Puedes ver tus datos, pero no guardar cambios hasta renovar.' };
    }
    if (s.estado === 'prueba') {
      return { vencida: false, icono: 'regalo', texto: `Prueba gratis: te quedan ${d} día${d === 1 ? '' : 's'}.` };
    }
    if (d <= 5) return { vencida: false, icono: 'reloj', texto: `Tu plan vence en ${d} día${d === 1 ? '' : 's'}.` };
    return null;
  });

  constructor() {
    this.cargar();
    // Si la sesión se cierra (en otra pestaña o por expiración) volvemos al login.
    effect(() => {
      if (!this.auth.sesion()) {
        this.datos.limpiar();
        this.router.navigateByUrl('/login');
      }
    });
  }

  private async cargar() {
    try {
      if (!this.auth.perfil()) await this.auth.cargarCuenta();
      if (!this.datos.cargado()) await this.datos.cargar();
      this.compartidas.cargar().catch(() => undefined);
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.cargando.set(false);
    }
  }

  async salir() {
    await this.auth.salir();
  }
}
