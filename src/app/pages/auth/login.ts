import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/supabase';
import { MarcaAuth } from '../../shared/marca-auth';
import { Icono } from '../../shared/icono';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, MarcaAuth, Icono],
  template: `
    <div class="auth-split">
      <app-marca-auth />
      <div class="auth-wrap">
      <div class="auth-card">
        <div class="logo">
          <div class="icono"><app-icono nombre="pesa" [tam]="22" /></div>
          <div><h1>COACH <span>FÉNIX</span></h1><small>Panel de Entrenador</small></div>
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
            @if (sinConfirmar()) {
              <button type="button" class="btn btn-suave btn-mini" style="justify-content:center;" [disabled]="cargando()" (click)="reenviar()">
                <app-icono nombre="enviar" [tam]="15" /> Reenviar correo de confirmación
              </button>
            }
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

  /** La cuenta existe pero no ha confirmado el correo: se ofrece reenviarlo. */
  readonly sinConfirmar = signal(false);

  async entrar() {
    this.error.set('');
    this.aviso.set('');
    this.sinConfirmar.set(false);
    this.cargando.set(true);
    try {
      await this.auth.entrar(this.email.trim(), this.clave);
      this.router.navigateByUrl('/panel');
    } catch (e) {
      this.sinConfirmar.set(/Email not confirmed/i.test((e as { message?: string })?.message ?? ''));
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async reenviar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.reenviarConfirmacion(this.email.trim());
      this.sinConfirmar.set(false);
      this.aviso.set(`Te reenviamos el correo de confirmación a ${this.email.trim()}. Revisa también la carpeta de Spam.`);
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
