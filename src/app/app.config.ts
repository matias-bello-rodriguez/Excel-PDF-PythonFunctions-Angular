import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes'; // Archivo separado o definido aquí
import { DatePipe } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // ✔️ Provee las rutas
    provideHttpClient(), // ✔️ Provee HttpClient para las APIs
    DatePipe // Agregamos el DatePipe para poder usarlo en los servicios
  ]
};