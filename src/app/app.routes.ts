import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { TakeoffListComponent } from './pages/takeoff-list/takeoff-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: TakeoffListComponent },
      { path: 'clientes', component: TakeoffListComponent },
      { path: 'proyectos', component: TakeoffListComponent },
      { path: 'cubicaciones', component: TakeoffListComponent },
      { path: 'reportes', component: TakeoffListComponent },
      { path: 'configuracion', component: TakeoffListComponent },
      { path: 'equipo', component: TakeoffListComponent },
      { path: 'ayuda', component: TakeoffListComponent }
    ]
  }
];