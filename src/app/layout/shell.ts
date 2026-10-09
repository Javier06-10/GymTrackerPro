import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DatosService } from '../core/datos.service';
import { UiService } from '../core/ui.service';
import { AtletaForm } from '../pages/atleta/atleta-form';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AtletaForm],
  template: `
    <div id="app">
      <header class="top">
        <a class="logo" routerLink="/panel" style="text-decoration:none;color:inherit;">
          <div class="icono" id="logo-caja">
            @if (auth.perfil()?.logo_url; as logo) { <img [src]="logo" alt="logo" /> } @else { 🏋️ }
          </div>
          <div>
            <h1>GYMTRACKER <span>PRO</span></h1>
            <small>Panel de Entrenador · {{ auth.perfil()?.negocio || auth.perfil()?.nombre }}</small>
          </div>
        </a>
        <nav class="nav-top">
          <a routerLink="/panel" routerLinkActive="activo">Panel</a>
          <a routerLink="/cuenta" routerLinkActive="activo">Mi cuenta</a>
          @if (auth.esAdmin()) { <a routerLink="/admin" routerLinkActive="activo">Admin</a> }
        </nav>
        <div class="separador"></div>
        <button class="btn btn-primario" (click)="ui.formAtleta.set({ id: null })" [disabled]="!auth.vigente()">
          ＋<span class="btn-txt"> Nuevo Atleta</span>
        </button>
        <button class="btn btn-fantasma menu-movil" (click)="menu.set(!menu())">☰</button>
        <button class="btn btn-fantasma btn-txt" (click)="salir()" title="Cerrar sesión">⎋</button>
        @if (menu()) {
          <div class="menu-desplegable" (click)="menu.set(false)">
            <a routerLink="/panel">🏠 Panel</a>
            <a routerLink="/cuenta">👤 Mi cuenta y plan</a>
            @if (auth.esAdmin()) { <a routerLink="/admin">🛠️ Administración</a> }
            <button (click)="salir()">⎋ Cerrar sesión</button>
          </div>
        }
      </header>

      @if (banner(); as b) {
        <div class="banner-sus" [class.vencida]="b.vencida">
          <span>{{ b.texto }}</span>
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
  private readonly router = inject(Router);
  protected readonly menu = signal(false);
  protected readonly cargando = signal(true);

  protected readonly banner = computed(() => {
    const s = this.auth.suscripcion();
    if (!s) return null;
    const d = this.auth.diasRestantes();
    if (!this.auth.vigente()) {
      return { vencida: true, texto: '⛔ Tu suscripción no está vigente. Puedes ver tus datos, pero no guardar cambios hasta renovar.' };
    }
    if (s.estado === 'prueba') {
      return { vencida: false, texto: `🎁 Prueba gratis: te quedan ${d} día${d === 1 ? '' : 's'}.` };
    }
    if (d <= 5) return { vencida: false, texto: `⏰ Tu plan vence en ${d} día${d === 1 ? '' : 's'}.` };
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
