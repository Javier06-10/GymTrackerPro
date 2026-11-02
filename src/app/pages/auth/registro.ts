import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeError } from '../../core/supabase';
import { environment } from '../../../environments/environment';
import { MarcaAuth } from '../../shared/marca-auth';
import { Icono } from '../../shared/icono';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, MarcaAuth, Icono],
  template: `
    <div class="auth-split">
      <app-marca-auth />
      <div class="auth-wrap">
      <div class="auth-card">
        <div class="logo">
          <div class="icono"><app-icono nombre="pesa" [tam]="22" /></div>
          <div><h1>COACH <span>FÉNIX</span></h1><small>Crea tu cuenta de entrenador</small></div>
        </div>
        <div class="tarjeta">
          @if (enviado()) {
            <div class="ok-form">
              ¡Cuenta creada! Te enviamos un correo a <b>{{ email }}</b>. Confirma tu cuenta desde ese enlace y luego entra.
            </div>
            <div class="nota-info" style="margin-top:10px;">
              ¿No te llega en unos minutos? Revisa la carpeta de <b>Spam</b> o
              <a [href]="enlaceWhatsApp()" target="_blank" rel="noopener">escríbenos por WhatsApp</a> y activamos tu cuenta.
            </div>
            <a routerLink="/login" class="btn btn-primario" style="justify-content:center;margin-top:14px;">Ir a entrar</a>
          } @else {
            <form (ngSubmit)="registrar()">
              <div class="campo"><label>Tu nombre</label>
                <input name="nombre" [(ngModel)]="nombre" required placeholder="Ej. Victor Pérez" /></div>
              <div class="campo"><label>Nombre del negocio (opcional)</label>
                <input name="negocio" [(ngModel)]="negocio" placeholder="Ej. VP Fitness" /></div>
              <div class="campo"><label>Correo</label>
                <input type="email" name="email" [(ngModel)]="email" required autocomplete="email" /></div>
              <div class="campo"><label>Contraseña</label>
                <input type="password" name="clave" [(ngModel)]="clave" required minlength="6" autocomplete="new-password" /></div>
              @if (error()) { <div class="error-form">{{ error() }}</div> }
              <button class="btn btn-primario" style="justify-content:center;" [disabled]="cargando()">
                {{ cargando() ? 'Creando cuenta…' : 'Empezar prueba gratis de 14 días' }}
              </button>
              <div class="nota-info">Sin tarjeta. Al terminar la prueba eliges un plan.</div>
            </form>
          }
        </div>
        <div class="pie-auth">¿Ya tienes cuenta? <a routerLink="/login">Entrar</a></div>
      </div>
      </div>
    </div>
  `,
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  nombre = '';
  negocio = '';
  email = '';
  clave = '';
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly enviado = signal(false);

  enlaceWhatsApp() {
    const msj = `Hola 👋 Me registré en Coach Fénix con el correo ${this.email.trim()} y no me llegó el correo de confirmación.`;
    return 'https://wa.me/' + environment.whatsappVentas + '?text=' + encodeURIComponent(msj);
  }

  async registrar() {
    this.error.set('');
    if (!this.nombre.trim()) return this.error.set('Escribe tu nombre');
    if (this.clave.length < 6) return this.error.set('La contraseña debe tener al menos 6 caracteres');
    this.cargando.set(true);
    try {
      const r = await this.auth.registrar(this.email.trim(), this.clave, this.nombre.trim(), this.negocio.trim());
      if (r.requiereConfirmacion) this.enviado.set(true);
      else this.router.navigateByUrl('/panel');
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
