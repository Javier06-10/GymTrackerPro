import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/supabase';
import { MarcaAuth } from '../../shared/marca-auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, MarcaAuth],
  template: `
    <div class="auth-split">
      <app-marca-auth />
      <div class="auth-wrap">
      <div class="auth-card">
        <div class="logo">
          <div class="icono">🏋️</div>
          <div><h1>GYMTRACKER <span>PRO</span></h1><small>Panel de Entrenador</small></div>
        </div>
        <div class="tarjeta">
          <form (ngSubmit)="recuperando() ? recuperar() : entrar()">
            <div class="campo">
              <label>Correo</label>
              <input type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
            </div>
            @if (!recuperando()) {
              <div class="campo">
                <label>Contraseña</label>
                <input type="password" name="clave" [(ngModel)]="clave" required autocomplete="current-password" />
              </div>
            }
            @if (error()) { <div class="error-form">{{ error() }}</div> }
            @if (aviso()) { <div class="ok-form">{{ aviso() }}</div> }
            <button class="btn btn-primario" style="justify-content:center;" [disabled]="cargando()">
              {{ cargando() ? 'Un momento…' : recuperando() ? 'Enviar enlace de recuperación' : 'Entrar' }}
            </button>
            <button type="button" class="btn btn-fantasma btn-mini" style="align-self:center;"
              (click)="recuperando.set(!recuperando()); error.set(''); aviso.set('')">
              {{ recuperando() ? '← Volver a entrar' : '¿Olvidaste tu contraseña?' }}
            </button>
          </form>
        </div>
        <div class="pie-auth">¿Eres entrenador y no tienes cuenta? <a routerLink="/registro">Prueba 14 días gratis</a></div>
      </div>
      </div>
    </div>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  email = '';
  clave = '';
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');
  readonly recuperando = signal(false);

  async entrar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.entrar(this.email.trim(), this.clave);
      this.router.navigateByUrl('/panel');
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async recuperar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.recuperarClave(this.email.trim());
      this.aviso.set('Si el correo existe, te enviamos un enlace para cambiar la contraseña.');
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
