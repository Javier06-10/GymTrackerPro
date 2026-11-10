import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Páginas públicas de Privacidad y Términos. El texto es una base razonable para
// República Dominicana (Ley 172-13); conviene que un abogado lo revise.
const ACTUALIZADO = '10 de noviembre de 2026';

@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  template: `
    <div class="legal">
      <header class="legal-top">
        <a routerLink="/login" class="logo" style="text-decoration:none;color:inherit;">
          <div class="icono icono-fenix"><img src="icons/fenix.svg" alt="" class="marca-fenix" /></div>
          <div><h1>COACH <span>FÉNIX</span></h1></div>
        </a>
        <nav>
          <a routerLink="/privacidad" [class.activo]="tipo() === 'privacidad'">Privacidad</a>
          <a routerLink="/terminos" [class.activo]="tipo() === 'terminos'">Términos</a>
        </nav>
      </header>

      <article class="legal-doc">
        @if (tipo() === 'privacidad') {
          <h2>Política de privacidad</h2>
          <p class="legal-fecha">Última actualización: {{ actualizado }}</p>
          <p>Coach Fénix (<b>coachfenix.com</b>) es un software para entrenadores personales. Esta política explica qué datos tratamos, para qué y qué derechos tienes, de acuerdo con la Ley 172-13 de República Dominicana sobre protección de datos personales.</p>

          <h3>1. Quién es quién</h3>
          <p><b>El entrenador</b> crea su cuenta y registra en ella los datos de sus atletas. Respecto a esos datos, el entrenador es el responsable: decide qué guarda y para qué. <b>Coach Fénix</b> solo los almacena y procesa para prestarle el servicio, y no los usa para ningún otro fin.</p>

          <h3>2. Datos que tratamos</h3>
          <ul>
            <li><b>De la cuenta del entrenador:</b> nombre, nombre del negocio, correo, contraseña (guardada cifrada, nunca la vemos), logo y preferencias.</li>
            <li><b>De los atletas que registra el entrenador:</b> nombre, datos de contacto, objetivo, medidas corporales y fotos de progreso, rutinas, asistencia, plan de comidas y pagos.</li>
            <li><b>De la suscripción:</b> plan, fechas y pagos registrados.</li>
          </ul>
          <p>Las medidas corporales y el progreso físico son datos sensibles. El entrenador debe contar con el consentimiento de cada atleta antes de registrarlos.</p>

          <h3>3. Para qué los usamos</h3>
          <ul>
            <li>Dar acceso a la cuenta y prestar las funciones de la app (seguimiento, rutinas, reportes en PDF, cobros).</li>
            <li>Enviar correos necesarios del servicio: confirmación de cuenta, recuperación de contraseña y avisos de la suscripción.</li>
            <li>Atender soporte y cobrar la suscripción.</li>
          </ul>
          <p>No vendemos ni alquilamos datos, no mostramos publicidad y no compartimos datos de atletas con terceros para fines comerciales.</p>

          <h3>4. Dónde se guardan</h3>
          <p>Los datos se alojan con proveedores de infraestructura que actúan como encargados del tratamiento: <b>Supabase</b> (base de datos y autenticación, servidores en Estados Unidos), <b>Render</b> (alojamiento de la web) y un proveedor de envío de correos. La comunicación va cifrada (HTTPS) y cada entrenador solo puede ver sus propios datos.</p>

          <h3>5. Cuánto tiempo</h3>
          <p>Conservamos los datos mientras la cuenta esté activa. Si el entrenador pide cerrar su cuenta, borramos sus datos y los de sus atletas en un plazo de 30 días, salvo lo que la ley obligue a conservar (por ejemplo, registros de pagos).</p>

          <h3>6. Tus derechos</h3>
          <p>Puedes pedir acceso, rectificación, cancelación u oposición sobre tus datos. Si eres atleta, dirígete primero a tu entrenador; si no te responde, escríbenos. El entrenador puede descargar un respaldo de sus datos desde <b>Mi cuenta</b> en cualquier momento.</p>

          <h3>7. Cookies</h3>
          <p>Solo usamos el almacenamiento del navegador necesario para mantener tu sesión y tus preferencias (tema y unidades). No usamos cookies de publicidad ni de rastreo.</p>

          <h3>8. Menores</h3>
          <p>Las cuentas de entrenador son para mayores de 18 años. Si un entrenador registra a un atleta menor de edad, debe contar con la autorización de su madre, padre o tutor.</p>

          <h3>9. Cambios</h3>
          <p>Si cambiamos esta política, actualizaremos la fecha de arriba y avisaremos dentro de la app cuando el cambio sea importante.</p>
        } @else {
          <h2>Términos de uso</h2>
          <p class="legal-fecha">Última actualización: {{ actualizado }}</p>
          <p>Al crear una cuenta en Coach Fénix (<b>coachfenix.com</b>) aceptas estos términos. Si no estás de acuerdo, no uses el servicio.</p>

          <h3>1. El servicio</h3>
          <p>Coach Fénix es un software en línea para que entrenadores personales gestionen a sus atletas: medidas, progreso, rutinas, asistencia, nutrición, reportes y cobros. Se ofrece "tal cual", y trabajamos para que esté disponible y funcione bien, pero no garantizamos que funcione sin interrupciones.</p>

          <h3>2. Tu cuenta</h3>
          <ul>
            <li>Debes ser mayor de 18 años y dar datos reales.</li>
            <li>Eres responsable de cuidar tu contraseña y de lo que se haga con tu cuenta.</li>
            <li>Una cuenta es para un entrenador o negocio; no se puede revender el acceso.</li>
          </ul>

          <h3>3. Prueba gratis y planes</h3>
          <ul>
            <li>Toda cuenta nueva tiene <b>14 días de prueba gratis</b>, sin tarjeta.</li>
            <li>Al terminar la prueba, para seguir agregando o editando datos debes activar un plan. Los pagos se coordinan por WhatsApp al {{ whatsapp }} y se activan manualmente.</li>
            <li>Si el plan vence, tu cuenta queda en modo de solo lectura: no se borra nada y puedes renovar cuando quieras.</li>
            <li>Los precios pueden cambiar; los cambios no afectan el período que ya pagaste.</li>
            <li>No se hacen reembolsos de períodos ya iniciados, salvo que la ley disponga otra cosa.</li>
          </ul>

          <h3>4. Los datos de tus atletas</h3>
          <p>Los datos que registras son tuyos. Tú eres responsable de contar con el consentimiento de tus atletas para registrarlos (en especial medidas y fotos) y de usarlos solo para su entrenamiento. Nosotros los tratamos según la <a routerLink="/privacidad">Política de privacidad</a>.</p>

          <h3>5. Uso aceptable</h3>
          <p>No puedes usar Coach Fénix para actividades ilegales, para intentar acceder a datos de otros entrenadores, para atacar o sobrecargar el servicio, ni para subir contenido ofensivo o que no tengas derecho a usar.</p>

          <h3>6. Contenido de orientación</h3>
          <p>Los manuales, planes de comidas sugeridos y recomendaciones de la app son orientativos y no sustituyen la valoración de un médico o nutricionista. El entrenador decide cómo aplicarlos con cada atleta.</p>

          <h3>7. Cancelación</h3>
          <p>Puedes dejar de usar el servicio cuando quieras y pedirnos que borremos tu cuenta. Podemos suspender cuentas que incumplan estos términos, avisando antes cuando sea posible.</p>

          <h3>8. Responsabilidad</h3>
          <p>En la medida que lo permita la ley, Coach Fénix no responde por daños indirectos ni por pérdidas derivadas del uso del servicio, y nuestra responsabilidad total se limita a lo que pagaste en los últimos 3 meses. Te recomendamos descargar respaldos de tus datos periódicamente desde <b>Mi cuenta</b>.</p>

          <h3>9. Ley aplicable</h3>
          <p>Estos términos se rigen por las leyes de la República Dominicana.</p>
        }

        <div class="legal-contacto">
          <b>¿Preguntas?</b> Escríbenos a <a [href]="'mailto:' + correo">{{ correo }}</a> o por WhatsApp al {{ whatsapp }}.
        </div>
      </article>

      <footer class="legal-pie"><a routerLink="/login">Entrar</a> · <a routerLink="/registro">Crear cuenta gratis</a></footer>
    </div>
  `,
})
export class Legal {
  private readonly ruta = inject(ActivatedRoute);
  readonly tipo = toSignal(this.ruta.data.pipe(map((d) => d['tipo'] as 'privacidad' | 'terminos')), { initialValue: 'privacidad' as const });
  readonly actualizado = ACTUALIZADO;
  readonly correo = environment.correoContacto;
  readonly whatsapp = environment.whatsappVentasTxt;
}
