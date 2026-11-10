import { Routes } from '@angular/router';
import { adminGuard, authGuard, invitadoGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', title: 'Coach Fénix — Software para entrenadores personales', canActivate: [invitadoGuard], loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'registro', title: 'Crea tu cuenta — Coach Fénix', canActivate: [invitadoGuard], loadComponent: () => import('./pages/auth/registro').then((m) => m.Registro) },
  { path: 'privacidad', title: 'Política de privacidad — Coach Fénix', data: { tipo: 'privacidad' }, loadComponent: () => import('./pages/legal/legal').then((m) => m.Legal) },
  { path: 'terminos', title: 'Términos de uso — Coach Fénix', data: { tipo: 'terminos' }, loadComponent: () => import('./pages/legal/legal').then((m) => m.Legal) },
  {
    path: '',
    title: 'Coach Fénix',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: 'panel', loadComponent: () => import('./pages/panel/panel').then((m) => m.Panel) },
      { path: 'atletas/:id', loadComponent: () => import('./pages/atleta/atleta').then((m) => m.AtletaPage) },
      { path: 'asistencia', loadComponent: () => import('./pages/asistencia/pasar-lista').then((m) => m.PasarLista) },
      { path: 'manual', loadComponent: () => import('./pages/manual/manual').then((m) => m.Manual) },
      { path: 'cuenta', loadComponent: () => import('./pages/cuenta/cuenta').then((m) => m.Cuenta) },
      { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin) },
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
    ],
  },
  { path: '**', redirectTo: '' },
];
