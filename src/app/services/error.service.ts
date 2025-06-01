import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  constructor(public snackBar: MatSnackBar) {}  public handle(error: any, context?: string): void {
    console.error('Error en:', context || 'aplicación', error);

    let message: string;

    if (error?.code === 'PGRST301') {
      message = 'Error de autenticación. Por favor, inicie sesión nuevamente.';
    } else if (error?.code === '23505') {
      message = 'Ya existe un registro con estos datos.';
    } else if (error?.code === '23503') {
      message = 'No se puede eliminar este registro porque está siendo utilizado.';
    } else if (error?.code === '23502') {
      message = 'Faltan campos requeridos.';
    } else if (error?.code === '42P01') {
      message = 'Error de configuración de base de datos.';
    } else if (error?.message && (error.message.includes('lock') || error.message.includes('Lock'))) {
      message = 'Error de bloqueo del navegador. Por favor, actualice la página e intente nuevamente.';
    } else if (error?.message && (error.message.includes('timeout') || error.message.includes('Timeout'))) {
      message = 'Error de tiempo de espera. Por favor, actualice la página e intente nuevamente.';
    } else if (error?.message && error.message.includes('Navigator')) {
      message = 'Error de navegador al acceder al almacenamiento. Por favor, cierre otras pestañas de esta aplicación, actualice la página e intente nuevamente.';
    } else if (error?.message && (error.message.includes('JWT') || error.message.includes('token'))) {
      message = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
    } else if (error?.message && error.message.includes('network')) {
      message = 'Error de conexión a internet. Por favor, verifique su conexión y vuelva a intentarlo.';
    } else if (error?.message) {
      message = error.message;
    } else {
      message = 'Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.';
    }

    this.showError(message);
    
    return error;
  }

  public showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  public showWarning(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  public showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 6000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  public showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}

// These example calls should be made from a component, not directly in the service file
// Example usage in a component:
// this.errorService.showError('Mensaje de error');
// this.errorService.showSuccess('Operación exitosa');
// this.errorService.showWarning('Advertencia');
// this.errorService.handle(error, 'Contexto del error');