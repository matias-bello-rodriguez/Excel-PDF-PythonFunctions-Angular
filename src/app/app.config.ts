import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // Archivo separado o definido aquí

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes) // ✔️ Provee las rutas
  ]
};