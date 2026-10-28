import { Routes } from '@angular/router';
import { adminGuard, authGuard, invitadoGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', canActivate: [invitadoGuard], loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'registro', canActivate: [invitadoGuard], loadComponent: () => import('./pages/auth/registro').then((m) => m.Registro) },
  {
    path: '',
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
