import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/side-menu/sidebar.component';
import { Title } from '@angular/platform-browser';
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
        <main class="main-content" #mainContent>
          <div class="content-container">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements AfterViewInit {
  @ViewChild('mainContent') mainContentRef!: ElementRef;

  constructor(private titleService: Title, private router: Router) {}
  ngAfterViewInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Scroll tanto de la ventana como del contenedor
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (this.mainContentRef?.nativeElement) {
        this.mainContentRef.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Título dinámico según ruta
      let title = 'Sistema de Cubicaciones | Kinetta';
      const currentRoute = this.router.url;

      const titleMap: { [key: string]: string } = {
        '/takeoff-list': 'Gestión de Cubicaciones',
        '/reportes': 'Reportes y Análisis',
      };

      if (titleMap[currentRoute]) {
        title = `${titleMap[currentRoute]} | Kinetta`;
      }

      this.titleService.setTitle(title);
    });
  }
}
