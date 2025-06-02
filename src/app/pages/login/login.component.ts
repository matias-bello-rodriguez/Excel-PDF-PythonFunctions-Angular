import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { ErrorService } from '../../services/error.service';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
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
    private errorService: ErrorService,
    private usuarioService: UsuarioService,
    private authService: AuthService
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
    // Primero intentar la autenticación con Supabase utilizando el método oficial
    this.supabaseService.signInWithEmail(email, password)
      .then(data => {
        console.log('Autenticación Supabase exitosa', data);
        
        // Verificar el usuario en nuestra base de datos
        this.usuarioService.getByEmail(email)
          .then(usuario => {
            if (!usuario) {
              this.isLoading = false;
              this.loginError = 'Usuario no encontrado en el sistema.';
              return;
            }

            if (!usuario.activo) {
              this.isLoading = false;
              this.loginError = 'Su cuenta está desactivada. Por favor, contacte al administrador.';
              // Cerrar la sesión en Supabase ya que el usuario está desactivado
              this.supabaseService.signOut();
              return;
            }

            console.log('Login exitoso:', usuario);
            
            // Actualizar último acceso ahora que tenemos una sesión válida
            if (usuario.id) {
              this.usuarioService.updateUltimoAcceso(usuario.id)
                .catch(error => {
                  console.warn('Error actualizando último acceso:', error);
                  // No interrumpir el flujo de login por este error
                });
            }
            
            // Autenticación exitosa, guardar en el AuthService
            this.authService.setAuthenticatedUser(usuario);
            this.isLoading = false;
            
            // Redirigir al dashboard
            this.router.navigate(['/inicio']);
          })
          .catch(error => {
            console.error('Error obteniendo datos de usuario:', error);
            this.isLoading = false;
            this.loginError = 'Error al verificar datos de usuario.';
            this.errorService.handle(error, 'Verificando usuario');
          });
      })
      .catch(error => {
        console.error('Error en autenticación Supabase:', error);
        this.isLoading = false;
        
        // Manejar errores específicos de Supabase
        if (error.message?.includes('Invalid login credentials')) {
          this.loginError = 'Credenciales inválidas. Por favor, verifique su correo y contraseña.';
        } else if (error.message?.includes('Email not confirmed')) {
          this.loginError = 'Email no confirmado. Por favor, verifique su bandeja de entrada.';
        } else if (error.message?.includes('rate limit')) {
          this.loginError = 'Demasiados intentos fallidos. Por favor, inténtelo más tarde.';
        } else {
          this.loginError = 'Error de inicio de sesión. Por favor, inténtelo de nuevo.';
        }
        
        this.errorService.handle(error, 'Inicio de sesión');
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
