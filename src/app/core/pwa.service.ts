import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** Evento que Chrome/Edge/Android lanzan cuando la app se puede instalar. */
interface EventoInstalacion extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Lo guarda el script de index.html si el evento llega antes de que arranque Angular. */
    __pwaPrompt?: EventoInstalacion | null;
  }
}

const CADA_30_MIN = 30 * 60 * 1000;

/** Instalación como app (PWA) y aviso de versión nueva publicada. */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly sw = inject(SwUpdate);
  private aviso: EventoInstalacion | null = window.__pwaPrompt ?? null;

  /** Ya corre como app instalada (pantalla completa, sin barra del navegador). */
  readonly instalada = signal(
    matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  /** El navegador ofrece el diálogo de instalación (Chrome, Edge, Android). */
  readonly instalable = signal(!!this.aviso);
  /** iPhone/iPad: no hay diálogo, se instala desde Compartir → Agregar a inicio. */
  readonly esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  readonly ayudaIOS = signal(false);
  /** Hay una versión nueva descargada lista para usar. */
  readonly actualizacion = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.aviso = e as EventoInstalacion;
      this.instalable.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.aviso = null;
      this.instalable.set(false);
      this.instalada.set(true);
    });

    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates.subscribe((ev) => {
      if (ev.type === 'VERSION_READY') this.actualizacion.set(true);
    });
    // La caché quedó inservible (p. ej. se borraron archivos): recargar desde la red.
    this.sw.unrecoverable.subscribe(() => location.reload());
    setInterval(() => this.sw.checkForUpdate().catch(() => undefined), CADA_30_MIN);
  }

  /** Se puede ofrecer instalar: diálogo nativo o instrucciones de iPhone. */
  puedeOfrecer() {
    return !this.instalada() && (this.instalable() || this.esIOS);
  }

  async instalar() {
    if (this.aviso) {
      await this.aviso.prompt();
      const { outcome } = await this.aviso.userChoice;
      this.aviso = null;
      window.__pwaPrompt = null;
      this.instalable.set(false);
      if (outcome === 'accepted') this.instalada.set(true);
    } else if (this.esIOS) {
      this.ayudaIOS.set(true);
    }
  }

  async actualizar() {
    try {
      await this.sw.activateUpdate();
    } finally {
      location.reload();
    }
  }
}
