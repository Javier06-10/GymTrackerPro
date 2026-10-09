import { Injectable, computed, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { Perfil, Plan, Suscripcion } from './modelos';
import { supabase } from './supabase';
import { diasDesde } from './util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly sesion = signal<Session | null>(null);
  readonly perfil = signal<Perfil | null>(null);
  readonly suscripcion = signal<Suscripcion | null>(null);
  readonly planes = signal<Plan[]>([]);

  /** Se resuelve cuando ya se leyó la sesión guardada (lo usan los guards). */
  readonly listo: Promise<void>;

  readonly esAdmin = computed(() => this.perfil()?.rol === 'admin');
  readonly plan = computed(() => this.planes().find((p) => p.id === this.suscripcion()?.plan_id) ?? null);
  /** Días que faltan para que venza (negativo si ya venció). */
  readonly diasRestantes = computed(() => {
    const s = this.suscripcion();
    return s ? -(diasDesde(s.vence_el) ?? 0) : 0;
  });
  readonly vigente = computed(() => {
    const s = this.suscripcion();
    return !!s && (s.estado === 'prueba' || s.estado === 'activa') && this.diasRestantes() >= 0;
  });

  constructor() {
    this.listo = this.iniciar();
    supabase.auth.onAuthStateChange((evento, sesion) => {
      this.sesion.set(sesion);
      if (evento === 'SIGNED_OUT') {
        this.perfil.set(null);
        this.suscripcion.set(null);
      }
    });
  }

  private async iniciar() {
    const { data } = await supabase.auth.getSession();
    this.sesion.set(data.session);
    await this.cargarPlanes();
    if (data.session) await this.cargarCuenta();
  }

  async cargarPlanes() {
    const { data } = await supabase.from('planes').select('*').eq('activo', true).order('precio_mensual');
    this.planes.set((data as Plan[]) ?? []);
  }

  async cargarCuenta() {
    const uid = this.sesion()?.user.id;
    if (!uid) return;
    const [perfil, sus] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', uid).single(),
      supabase.from('suscripciones').select('*').eq('trainer_id', uid).single(),
    ]);
    this.perfil.set((perfil.data as Perfil) ?? null);
    this.suscripcion.set((sus.data as Suscripcion) ?? null);
  }

  async entrar(email: string, clave: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave });
    if (error) throw error;
    await this.cargarCuenta();
  }

  async registrar(email: string, clave: string, nombre: string, negocio: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: clave,
      options: { data: { nombre, negocio }, emailRedirectTo: location.origin + '/login' },
    });
    if (error) throw error;
    // Si el proyecto no exige confirmar correo, ya hay sesión.
    if (data.session) await this.cargarCuenta();
    return { requiereConfirmacion: !data.session };
  }

  async recuperarClave(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/cuenta' });
    if (error) throw error;
  }

  async salir() {
    await supabase.auth.signOut();
  }

  async actualizarPerfil(cambios: Partial<Pick<Perfil, 'nombre' | 'negocio' | 'telefono' | 'logo_url'>>) {
    const uid = this.sesion()?.user.id;
    const { data, error } = await supabase.from('perfiles').update(cambios).eq('id', uid!).select().single();
    if (error) throw error;
    this.perfil.set(data as Perfil);
  }

  async cambiarClave(clave: string) {
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) throw error;
  }
}
