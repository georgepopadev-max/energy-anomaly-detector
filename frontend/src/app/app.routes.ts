import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard - Energy Anomaly Detector'
  },
  {
    path: 'anomalies',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Anomalies - Energy Anomaly Detector'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
