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
          <div class="icono icono-fenix"><img src="icons/fenix.svg" alt="" class="marca-fenix" /></div>
          <div><h1>COACH <span>FÉNIX</span></h1><small>Panel de Entrenador</small></div>
        </div>
        <div class="auth-titulo">
          @if (recuperando()) {
            <h2>Recupera tu contraseña</h2>
            <p>Escribe tu correo y te enviamos un enlace para crear una nueva.</p>
          } @else {
            <h2>Bienvenido de vuelta</h2>
            <p>Entra a tu panel para ver a tus atletas.</p>
          }
        </div>
        <div class="tarjeta">
          <form (ngSubmit)="recuperando() ? recuperar() : entrar()">
            <div class="campo">
              <label for="login-email">Correo</label>
              <div class="campo-icono">
                <app-icono nombre="correo" [tam]="17" />
                <input id="login-email" type="email" name="email" [(ngModel)]="email" required autocomplete="email" placeholder="tu@correo.com" />
              </div>
            </div>
            @if (!recuperando()) {
              <div class="campo">
                <label for="login-clave">Contraseña</label>
                <div class="campo-icono">
                  <app-icono nombre="candado" [tam]="17" />
                  <input id="login-clave" [type]="verClave() ? 'text' : 'password'" name="clave" [(ngModel)]="clave" required autocomplete="current-password" placeholder="Tu contraseña" />
                  <button type="button" class="ver-clave" (click)="verClave.set(!verClave())" [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'" [title]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                    <app-icono [nombre]="verClave() ? 'ojoNo' : 'ojo'" [tam]="17" />
                  </button>
                </div>
              </div>
            }
            @if (error()) { <div class="error-form">{{ error() }}</div> }
            @if (sinConfirmar()) {
              <button type="button" class="btn btn-suave btn-mini" style="justify-content:center;" [disabled]="cargando()" (click)="reenviar()">
                <app-icono nombre="enviar" [tam]="15" /> Reenviar correo de confirmación
              </button>
            }
            @if (aviso()) { <div class="ok-form">{{ aviso() }}</div> }
            <button class="btn btn-primario btn-auth" [disabled]="cargando()">
              {{ cargando() ? 'Un momento…' : recuperando() ? 'Enviar enlace de recuperación' : 'Entrar a mi panel' }}
              @if (!cargando()) { <app-icono nombre="flecha" [tam]="17" /> }
            </button>
            <button type="button" class="btn btn-fantasma btn-mini" style="align-self:center;"
              (click)="recuperando.set(!recuperando()); error.set(''); aviso.set('')">
              {{ recuperando() ? '← Volver a entrar' : '¿Olvidaste tu contraseña?' }}
            </button>
          </form>
        </div>
        <div class="separador-auth"><span>¿Nuevo en Coach Fénix?</span></div>
        <a routerLink="/registro" class="btn btn-suave btn-auth">Crear cuenta gratis · 14 días sin tarjeta</a>
        <div class="pie-legal"><a routerLink="/privacidad">Privacidad</a> · <a routerLink="/terminos">Términos</a> · <a href="mailto:hola@coachfenix.com">hola&#64;coachfenix.com</a></div>
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
  readonly verClave = signal(false);

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
