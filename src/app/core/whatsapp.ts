import { Atleta } from './modelos';

export function telWhatsApp(telefono: string): string | null {
  let d = (telefono || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 10) d = '1' + d; // RD y NANP: 809/829/849 + 7 dígitos
  return d;
}

/** Abre WhatsApp con el mensaje. Devuelve false si el atleta no tiene teléfono. */
export function abrirWhatsApp(a: Pick<Atleta, 'telefono'>, mensaje: string): boolean {
  const tel = telWhatsApp(a.telefono);
  if (!tel) return false;
  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(mensaje), '_blank');
  return true;
}

export function primerNombre(nombre: string): string {
  return nombre.split(' ')[0];
}
