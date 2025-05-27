import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TakeoffListComponent } from './pages/takeoff-list/takeoff-list.component';
import { TakeoffAddComponent } from './pages/takeoff-add/takeoff-add.component';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductAddWindowComponent } from './pages/product-add/product-add-window.component';
import { ProductAddMultipleWindowComponent } from './pages/product-add-multiple-window/product-add-multiple-window.component';
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectAddComponent } from './pages/project-add/project-add.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  // Redirección inicial a login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
    data: { scrollPositionRestoration: 'top' }  // Añadir esta línea
  },
  // Ruta de login independiente (sin layout)
  {
    path: 'login',
    component: LoginComponent,
    data: { scrollPositionRestoration: 'top' }  // Añadir esta línea
  },  // Rutas principales con layout (protegidas por auth guard)
  {
    path: '',
    component: MainLayoutComponent,
    data: { scrollPositionRestoration: 'top' },  // Añadir esta línea
    children: [{ path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: DashboardComponent },
      { path: 'clientes', component: CustomerListComponent },
      { path: 'productos', component: ProductListComponent },
      { path: 'productos/agregar-producto', component: ProductAddWindowComponent },
      { path: 'productos/agregar-producto-multiple', component: ProductAddMultipleWindowComponent },
      { path: 'productos/agregar-producto-multiple/:moduleId', component: ProductAddWindowComponent },
      { path: 'cubicaciones/productos/:cubicacionId', component: ProductListComponent }, // Ahora acepta parámetro de cubicación
      { path: 'cubicaciones/productos', component: ProductListComponent }, // Ruta sin parámetro (opcional, para compatibilidad)
      { path: 'proyectos', component: ProjectListComponent },
      { path: 'proyectos/agregar-proyecto', component: ProjectAddComponent },
      { path: 'cubicaciones', component: TakeoffListComponent },
      { path: 'cubicaciones/ingresar-cubicacion', component: TakeoffAddComponent },
      { path: 'take-offs', component: TakeoffListComponent }, // Manteniendo esta por si se usa en otro lado
      { path: 'reportes', component: ReportsComponent },      { path: 'configuracion', component: TakeoffListComponent }, // Placeholder
      { path: 'equipo', component: TakeoffListComponent }, // Placeholder
      { path: 'ayuda', component: TakeoffListComponent } // Placeholder
    ]
  },
  // Ruta para manejar rutas no encontradas
  {
    path: '**',
    redirectTo: 'login',
    data: { scrollPositionRestoration: 'top' }  // Añadir esta línea
  }
];