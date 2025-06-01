import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { ErrorService } from '../../services/error.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  loginError: string | null = null;
  loginAttempts = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabaseService: SupabaseService,
    private errorService: ErrorService
  ) {
    // Intentar limpiar el almacenamiento de autenticación al iniciar
    this.supabaseService.clearAuthStorage();
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = null;
      this.loginAttempts++;
      
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;
      
      console.log('Intentando inicio de sesión con:', email);
      
      // Si es el segundo intento o más, intentar reconectar primero
      if (this.loginAttempts > 1) {
        console.log('Múltiples intentos de login, intentando reconexión...');
        this.supabaseService.reconnect().then(success => {
          if (success) {
            console.log('Reconexión exitosa, continuando con login');
            this.attemptLogin(email, password);
          } else {
            console.log('Reconexión fallida, intentando login de todas formas');
            this.attemptLogin(email, password);
          }
        });
      } else {
        // Primer intento, solo limpiar storage
        this.supabaseService.clearAuthStorage();
        this.attemptLogin(email, password);
      }
    } else {
      this.markFormGroupTouched();
    }
  }
  
  private attemptLogin(email: string, password: string): void {
    this.supabaseService.signIn(email, password).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.isLoading = false;
        
        // Guardar estado de autenticación
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        
        // Redirigir al dashboard
        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isLoading = false;
        
        // Manejo de errores específicos
        if (error.message && (
            error.message.includes('lock') || 
            error.message.includes('Navigator') ||
            error.message.includes('acquire')
        )) {
          this.loginError = 'Error de bloqueo de navegador. Por favor, actualice la página e intente nuevamente.';
          // Intentar limpiar el almacenamiento y reconectar
          this.supabaseService.clearAuthStorage();
          this.supabaseService.reconnect();
        } else if (error.message && error.message.includes('Invalid login credentials')) {
          this.loginError = 'Credenciales inválidas. Por favor, verifique su correo y contraseña.';
        } else if (error.message && error.message.includes('JWT')) {
          this.loginError = 'Error de sesión. Por favor, actualice la página e intente nuevamente.';
          this.supabaseService.clearAuthStorage();
        } else if (error.message && error.message.includes('network')) {
          this.loginError = 'Error de red. Por favor, verifique su conexión a internet.';
        } else {
          this.loginError = `Error de inicio de sesión: ${error.message || 'Desconocido'}`;
        }
        
        this.errorService.handle(error, 'Inicio de sesión');
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'El correo electrónico' : 'La contraseña'} es requerida`;
      }
      if (field.errors['email']) {
        return 'Por favor, ingresa un correo electrónico válido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    return '';
  }
}
