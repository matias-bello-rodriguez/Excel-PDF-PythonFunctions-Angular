import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { TakeoffListComponent } from './pages/takeoff-list/takeoff-list.component';
import { TakeoffAddComponent } from './pages/takeoff-add/takeoff-add.component';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProjectListComponent } from './pages/project-list/project-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: TakeoffListComponent },
      { path: 'clientes', component: CustomerListComponent },
      { path: 'cubicaciones/productos/:cubicacionId', component: ProductListComponent }, // Ahora acepta parámetro de cubicación
      { path: 'cubicaciones/productos', component: ProductListComponent }, // Ruta sin parámetro (opcional, para compatibilidad)
      { path: 'proyectos', component: ProjectListComponent },
      { path: 'cubicaciones', component: TakeoffListComponent },
      { path: 'cubicaciones/ingresar-cubicacion', component: TakeoffAddComponent },
      { path: 'take-offs', component: TakeoffListComponent }, // Manteniendo esta por si se usa en otro lado
      { path: 'reportes', component: TakeoffListComponent }, // Placeholder
      { path: 'configuracion', component: TakeoffListComponent }, // Placeholder
      { path: 'equipo', component: TakeoffListComponent }, // Placeholder
      { path: 'ayuda', component: TakeoffListComponent } // Placeholder
    ]
  }
];