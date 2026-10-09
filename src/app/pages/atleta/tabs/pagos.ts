import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { DatosService } from '../../../core/datos.service';
import { Atleta, PagoAtleta } from '../../../core/modelos';
import { PdfService } from '../../../core/pdf.service';
import { UiService } from '../../../core/ui.service';
import { abrirWhatsApp, primerNombre } from '../../../core/whatsapp';
import { diasDesde, fmtDinero, fmtFecha, hoyISO, sumarDias } from '../../../core/util';
import { Modal } from '../../../shared/modal';
import { Icono } from '../../../shared/icono';

/** Control financiero por atleta (portado de tabPagos). */
@Component({
  selector: 'app-tab-pagos',
  imports: [FormsModule, Modal, Icono],
  template: `
    @let a = atleta();
    @if (a.telefono) {
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <button class="btn btn-suave btn-mini" (click)="recordar()"><app-icono nombre="chat" [tam]="15" /> Recordar pago por WhatsApp</button>
      </div>
    }
    <div class="grid-pagos">
      <div class="resumen-pago">
        <div class="dato-pago"><div class="e">Tarifa asignada</div><div class="v" style="color:var(--ambar)">{{ dinero(a.tarifa) }}</div></div>
        <div class="dato-pago">
          <div class="e">Fecha de próximo pago (corte)</div>
          <div class="v">{{ fecha(a.proximoPago) }}</div>
          @if (a.proximoPago) {
            <div style="font-size:12.5px;margin-top:3px;font-weight:700;">
              @if (dVenc() > 0) { <span class="vencido">Vencido hace {{ dVenc() }} día{{ dVenc() === 1 ? '' : 's' }}</span> }
              @else if (dVenc() === 0) { <span class="vencido">Vence hoy</span> }
              @else { <span class="al-dia">Al día · vence en {{ -dVenc() }} día{{ dVenc() === -1 ? '' : 's' }}</span> }
            </div>
          }
        </div>
        <div class="dato-pago"><div class="e">Total pagado histórico</div><div class="v" style="color:var(--verde)">{{ dinero(total()) }}</div></div>
        <button class="btn btn-suave" (click)="abrirConfig()"><app-icono nombre="engranaje" [tam]="16" /> Configurar tarifa y corte</button>
        <button class="btn btn-primario" (click)="abrirPago()"><app-icono nombre="mas" [tam]="16" /> Registrar pago</button>
      </div>
      <div class="tarjeta">
        <div style="font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><app-icono nombre="recibo" [tam]="18" /> Historial de transacciones</div>
        @if (!a.pagos.length) {
          <div class="vacio" style="padding:28px;"><span class="ic"><app-icono nombre="tarjeta" [tam]="40" /></span><p>Sin pagos registrados todavía.</p></div>
        } @else {
          <div class="tabla-scroll"><table>
            <tr><th>Fecha</th><th>Monto</th><th>Método</th><th>Concepto</th><th></th></tr>
            @for (p of pagosDesc(); track p.id) {
              <tr>
                <td>{{ fecha(p.fecha) }}</td>
                <td><b style="color:var(--verde)">{{ dinero(p.monto) }}</b></td>
                <td>{{ p.metodo }}</td>
                <td>{{ p.concepto }}</td>
                <td style="white-space:nowrap;">
                  <button class="btn-x" title="Descargar recibo" style="color:var(--acero);" (click)="recibo(p)"><app-icono nombre="recibo" [tam]="15" /></button>
                  <button class="btn-x" (click)="eliminar(p)"><app-icono nombre="cerrar" [tam]="15" /></button>
                </td>
              </tr>
            }
          </table></div>
        }
      </div>
    </div>

    @if (modalConfig()) {
      <app-modal titulo="Configurar Pagos" (cerrar)="modalConfig.set(false)">
        <div class="campo"><label>Tarifa asignada ($)</label><input type="number" step="0.01" [(ngModel)]="cfg.tarifa" placeholder="Ej. 4500" /></div>
        <div class="campo"><label>Fecha de próximo pago (corte)</label><input type="date" [(ngModel)]="cfg.corte" /></div>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="modalConfig.set(false)">Cancelar</button>
          <button class="btn btn-primario" (click)="guardarConfig()">Guardar</button>
        </ng-container>
      </app-modal>
    }

    @if (modalPago()) {
      <app-modal titulo="Registrar Pago" (cerrar)="modalPago.set(false)">
        <div class="form-grid">
          <div class="campo"><label>Fecha</label><input type="date" [(ngModel)]="pg.fecha" /></div>
          <div class="campo"><label>Monto ($)</label><input type="number" step="0.01" [(ngModel)]="pg.monto" /></div>
        </div>
        <div class="form-grid">
          <div class="campo"><label>Método de pago</label>
            <select [(ngModel)]="pg.metodo">@for (m of metodos; track m) { <option>{{ m }}</option> }</select></div>
          <div class="campo"><label>Concepto</label>
            <select [(ngModel)]="pg.concepto">@for (c of conceptos; track c) { <option>{{ c }}</option> }</select></div>
        </div>
        <label style="display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--texto-suave);cursor:pointer;">
          <input type="checkbox" [(ngModel)]="pg.extender" style="width:16px;height:16px;accent-color:var(--ambar);" />
          Extender la fecha de corte 30 días automáticamente
        </label>
        <ng-container pie>
          <button class="btn btn-fantasma" (click)="modalPago.set(false)">Cancelar</button>
          <button class="btn btn-primario" (click)="registrar()" [disabled]="guardando()">Registrar pago</button>
        </ng-container>
      </app-modal>
    }
  `,
})
export class TabPagos {
  readonly atleta = input.required<Atleta>();
  private readonly datos = inject(DatosService);
  private readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);
  private readonly pdf = inject(PdfService);

  async recibo(p: PagoAtleta) {
    await this.pdf.recibo(this.atleta(), p);
    this.ui.toast('Recibo descargado ✓');
  }

  protected readonly dinero = fmtDinero;
  protected readonly fecha = fmtFecha;
  protected readonly metodos = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'];
  protected readonly conceptos = ['Mensualidad', 'Asesoría Online', 'Sesión individual', 'Plan nutricional', 'Otro'];

  protected readonly dVenc = computed(() => diasDesde(this.atleta().proximoPago) ?? 0);
  protected readonly total = computed(() => this.atleta().pagos.reduce((s, p) => s + p.monto, 0));
  protected readonly pagosDesc = computed(() => this.atleta().pagos.slice().reverse());
  protected readonly guardando = signal(false);

  /* ---------- Configuración de tarifa ---------- */
  protected readonly modalConfig = signal(false);
  protected cfg = { tarifa: null as number | null, corte: '' };
  abrirConfig() {
    this.cfg = { tarifa: this.atleta().tarifa || null, corte: this.atleta().proximoPago };
    this.modalConfig.set(true);
  }
  async guardarConfig() {
    try {
      await this.datos.actualizarAtleta(this.atleta().id, { tarifa: Number(this.cfg.tarifa) || 0, proximoPago: this.cfg.corte });
      this.modalConfig.set(false);
      this.ui.toast('Configuración de pago guardada ✓');
    } catch (e) {
      this.ui.error(e);
    }
  }

  /* ---------- Registrar pago ---------- */
  protected readonly modalPago = signal(false);
  protected pg = { fecha: '', monto: null as number | null, metodo: 'Efectivo', concepto: 'Mensualidad', extender: true };
  abrirPago() {
    this.pg = { fecha: hoyISO(), monto: this.atleta().tarifa || null, metodo: 'Efectivo', concepto: 'Mensualidad', extender: true };
    this.modalPago.set(true);
  }
  async registrar() {
    const monto = Number(this.pg.monto);
    if (!this.pg.fecha) return this.ui.toast('Selecciona la fecha', 'err');
    if (!monto || monto <= 0) return this.ui.toast('Ingresa un monto válido', 'err');
    let nuevoCorte: string | undefined;
    if (this.pg.extender) {
      // Si el corte aún no llega, se extiende desde el corte; si ya pasó, desde la fecha del pago.
      const corte = this.atleta().proximoPago;
      const base = corte && (diasDesde(corte) ?? 0) < 0 ? corte : this.pg.fecha;
      nuevoCorte = sumarDias(base, 30);
    }
    this.guardando.set(true);
    try {
      await this.datos.registrarPago(this.atleta().id, { fecha: this.pg.fecha, monto, metodo: this.pg.metodo, concepto: this.pg.concepto }, nuevoCorte);
      this.modalPago.set(false);
      this.ui.toast('Pago registrado ✓');
    } catch (e) {
      this.ui.error(e);
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar(p: PagoAtleta) {
    if (!(await this.ui.confirmar('Eliminar transacción', 'Se borrará este pago del historial.'))) return;
    try {
      await this.datos.eliminarPago(this.atleta().id, p.id);
      this.ui.toast('Transacción eliminada');
    } catch (e) {
      this.ui.error(e);
    }
  }

  recordar() {
    const a = this.atleta();
    const monto = a.tarifa ? fmtDinero(a.tarifa) : 'tu mensualidad';
    const n = primerNombre(a.nombre);
    const firma = this.auth.perfil()?.nombre ? '\n— ' + this.auth.perfil()!.nombre : '';
    let msj: string;
    if (a.proximoPago) {
      const d = diasDesde(a.proximoPago) ?? 0;
      if (d > 0) msj = `Hola ${n} 👋 Te recuerdo que tu mensualidad de ${monto} venció hace ${d} día${d === 1 ? '' : 's'} (${fmtFecha(a.proximoPago)}). ¿Coordinamos el pago? 💪`;
      else if (d === 0) msj = `Hola ${n} 👋 Te recuerdo que tu mensualidad de ${monto} vence hoy. ¡Gracias! 💪`;
      else msj = `Hola ${n} 👋 Recordatorio: tu próximo pago de ${monto} es el ${fmtFecha(a.proximoPago)}. ¡Seguimos entrenando duro! 💪`;
    } else {
      msj = `Hola ${n} 👋 Te escribo por el tema de tu mensualidad (${monto}). ¿Coordinamos? 💪`;
    }
    abrirWhatsApp(a, msj + firma);
  }
}
