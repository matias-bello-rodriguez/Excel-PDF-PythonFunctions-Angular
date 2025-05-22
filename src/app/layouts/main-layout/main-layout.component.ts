import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/side-menu/sidebar.component';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="app-layout">
      <div class="header-row">
        <app-header></app-header>
      </div>
      <div class="content-row">
        <div class="sidebar-col">
          <app-sidebar></app-sidebar>
        </div>
        <main class="main-content">
          <div class="content-container">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  constructor(private titleService: Title, private router: Router) {
    // Actualizar el título basado en la ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let title = 'Sistema de Cubicaciones | Kinetta';
      const currentRoute = this.router.url;
      
      // Mapa de títulos según la ruta
      const titleMap: { [key: string]: string } = {
        '/takeoff-list': 'Gestión de Cubicaciones',
        // Agregar más mapeos de ruta a título según sea necesario
      };

      if (titleMap[currentRoute]) {
        title = `${titleMap[currentRoute]} | Kinetta`;
      }

      this.titleService.setTitle(title);
    });
  }
}
