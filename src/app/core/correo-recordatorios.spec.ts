import { FilaRecordatorio, armarCorreo, asunto } from '../../../supabase/functions/recordatorios/correo';

const base: FilaRecordatorio = {
  trainer_id: 't1',
  email: 'coach@ejemplo.com',
  nombre: 'Javier Pérez',
  negocio: 'JV Fitness',
  semanal: false,
  plan: null,
  vencidos: [],
  mediciones: [],
  cumples: [],
};

describe('correo de recordatorios', () => {
  it('el aviso del plan va primero en el asunto', () => {
    const f = { ...base, plan: { dias: 3, vence_el: '2026-11-30', plan: 'Básico', estado: 'activa' }, vencidos: [{ nombre: 'Ana', desde: '2026-11-20', dias: 7, tarifa: 50 }] };
    expect(asunto(f)).toBe('Tu plan vence en 3 días · Coach Fénix');
  });

  it('plan que vence hoy y plan vencido', () => {
    expect(asunto({ ...base, plan: { dias: 0, vence_el: '2026-11-27', plan: 'Pro', estado: 'activa' } })).toContain('vence hoy');
    expect(asunto({ ...base, plan: { dias: -1, vence_el: '2026-11-26', plan: 'Pro', estado: 'activa' } })).toContain('venció');
  });

  it('resume cobros, mediciones y cumpleaños con singular y plural correctos', () => {
    const f = {
      ...base,
      vencidos: [{ nombre: 'Ana', desde: '2026-11-20', dias: 7, tarifa: 50 }, { nombre: 'Luis', desde: '2026-11-26', dias: 1, tarifa: 30 }],
      mediciones: [{ nombre: 'Ana', ultima: '2026-10-01', dias: 57 }],
      cumples: [{ nombre: 'Luis', dias: 0, edad: 30 }],
    };
    expect(asunto(f)).toBe('2 cobros vencidos · 1 medición pendiente · 1 cumpleaños hoy · Coach Fénix');
    const c = armarCorreo(f);
    expect(c.html).toContain('$80.00 por cobrar');
    expect(c.html).toContain('vencido hace 1 día');
    expect(c.html).toContain('¡Hoy!');
    expect(c.texto).toContain('- Ana: última hace 57 días');
  });

  it('marca el resumen semanal', () => {
    const f = { ...base, semanal: true, mediciones: [{ nombre: 'Ana', ultima: '2026-10-01', dias: 57 }] };
    expect(asunto(f).startsWith('Resumen semanal: ')).toBeTrue();
  });

  it('escapa los nombres (un atleta no puede inyectar HTML en el correo)', () => {
    const f = { ...base, vencidos: [{ nombre: '<img src=x onerror=alert(1)>', desde: '2026-11-20', dias: 7, tarifa: 10 }] };
    const html = armarCorreo(f).html;
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('el botón lleva al plan si hay aviso del plan y al panel si no', () => {
    expect(armarCorreo({ ...base, plan: { dias: 1, vence_el: '2026-11-28', plan: 'Pro', estado: 'activa' } }).html).toContain('https://coachfenix.com/cuenta" style="display:inline-block');
    expect(armarCorreo({ ...base, cumples: [{ nombre: 'Ana', dias: 2, edad: 25 }] }).html).toContain('https://coachfenix.com/panel');
  });
});
