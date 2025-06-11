import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TakeoffListComponent } from './pages/takeoff-list/takeoff-list.component';
import { TakeoffAddComponent } from './pages/takeoff-add/takeoff-add.component';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { ProductListComponent } from './pages/product-list/product-list.component';
// import { ProductAddWindowComponent } from './pages/product-add/product-add-window.component';
import { ProductAddMultipleWindowComponent } from './pages/product-add-multiple-window/product-add-multiple-window.component';
import { ProjectListComponent } from './pages/project-list/project-list.component';
import { ProjectAddComponent } from './pages/project-add/project-add.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TakeoffProductListComponent } from './pages/takeoff-product-list/takeoff-product-list.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirección inicial a login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
    data: { scrollPositionRestoration: 'top' },
  },
  // Ruta de login independiente (sin layout)
  {
    path: 'login',
    component: LoginComponent,
    data: { scrollPositionRestoration: 'top' },
  }, 
  // Rutas principales con layout (protegidas por auth guard a nivel de grupo)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard], // Proteger todo el layout en lugar de rutas individuales
    canActivateChild: [AuthGuard], // Proteger también las rutas hijas
    data: { scrollPositionRestoration: 'top' },
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: DashboardComponent },
      { 
        path: 'clientes', 
        component: CustomerListComponent,
        data: { roles: ['ADMIN', 'MANAGER'] } // Ejemplo de restricción por rol
      },
      { path: 'productos', component: ProductListComponent },
      // {
      //   path: 'productos/agregar-ventana/:cubicacionId',
      //   component: ProductAddWindowComponent,
      // },
      {
        path: 'productos/agregar-producto-multiple',
        component: ProductAddMultipleWindowComponent,
      },
      // {
      //   path: 'productos/agregar-producto-multiple/:moduleId',
      //   component: ProductAddWindowComponent,
      // },
      {
        path: 'cubicaciones/productos/:codigo',
        component: ProductListComponent,
      },
      { path: 'cubicaciones/productos', component: ProductListComponent },
      {
        path: 'cubicaciones/productos/:id',
        component: TakeoffProductListComponent,
      },
      { path: 'proyectos', component: ProjectListComponent },
      { path: 'proyectos/agregar-proyecto', component: ProjectAddComponent },
      { path: 'cubicaciones', component: TakeoffListComponent },
      {
        path: 'cubicaciones/ingresar-cubicacion',
        component: TakeoffAddComponent,
      },
      { path: 'take-offs', component: TakeoffListComponent },
      { 
        path: 'reportes', 
        component: ReportsComponent,
        data: { roles: ['ADMIN', 'MANAGER'] } // Ejemplo de restricción por rol
      },
      { path: 'configuracion', component: TakeoffListComponent },
      { path: 'equipo', component: TakeoffListComponent },
      { path: 'ayuda', component: TakeoffListComponent },
    ],
  },
  // Ruta para acceso denegado
  
  // Ruta para manejar rutas no encontradas
  {
    path: '**',
    redirectTo: 'inicio',
    data: { scrollPositionRestoration: 'top' },
  },
];