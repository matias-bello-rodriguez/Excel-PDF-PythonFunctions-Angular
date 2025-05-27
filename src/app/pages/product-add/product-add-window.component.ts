import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Importar todos los componentes de formulario personalizados
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { FormSectionComponent } from '../../components/forms/form-section/form-section.component';
import { TextInputComponent } from '../../components/forms/text-input/text-input.component';
import { TextareaInputComponent } from '../../components/forms/textarea-input/textarea-input.component';
import { SelectInputComponent } from '../../components/forms/select-input/select-input.component';
import { FormButtonsComponent } from '../../components/forms/form-buttons/form-buttons.component';

interface Profile {
  category: string;
  material: string;
  color: string;
  width: number;
  height: number;
}

interface GlassConfiguration {
  type: string;
  protection?: string;
  color?: string;
  width: number;
  height: number;
  length?: number;
}

interface UploadedImage {
  url: string;
  name: string;
  file: File;
}

@Component({
  selector: 'app-product-add-window',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormFieldComponent,
    FormSectionComponent,
    TextInputComponent,
    TextareaInputComponent,
    SelectInputComponent,
    FormButtonsComponent
  ],
  templateUrl: './product-add-window.component.html',
  styleUrls: ['./product-add-window.component.scss']
})
export class ProductAddWindowComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropzoneElement') dropzoneElement!: ElementRef;

  productForm: FormGroup;
  isSubmitting = false;
  isDragOver = false;
  successMessage = '';
  errorMessage = '';
  isModuleEditing = false;
  uploadedImages: UploadedImage[] = [];
  
  // Propiedades para módulo
  moduleIndex: number = 0;
  moduleCode: string = '';

  // Arreglos para perfiles y configuraciones de vidrio
  profiles: Profile[] = [];
  glassConfigurations: GlassConfiguration[] = [];

  // Opciones para los selectores
  openingTypeOptions = [
    { value: 'corrediza', label: 'Corrediza' },
    { value: 'batiente', label: 'Batiente' },
    { value: 'fija', label: 'Fija' },
    { value: 'proyectante', label: 'Proyectante' },
    { value: 'oscilobatiente', label: 'Oscilobatiente' }
  ];

  lockSystemOptions = [
    { value: 'manilla', label: 'Manilla' },
    { value: 'cremona', label: 'Cremona' },
    { value: 'cierre_embutido', label: 'Cierre Embutido' },
    { value: 'llave', label: 'Llave' }
  ];

  profileCategoryOptions = [
    { value: 'marco', label: 'Marco' },
    { value: 'hoja', label: 'Hoja' },
    { value: 'travesano', label: 'Travesaño' },
    { value: 'junquillo', label: 'Junquillo' }
  ];

  profileMaterialOptions = [
    { value: 'aluminio', label: 'Aluminio' },
    { value: 'pvc', label: 'PVC' },
    { value: 'madera', label: 'Madera' }
  ];

  glassTypeNewOptions = [
    { value: 'monolitico', label: 'Monolítico' },
    { value: 'laminado', label: 'Laminado' },
    { value: 'doble', label: 'Doble Vidriado Hermético (DVH)' },
    { value: 'templado', label: 'Templado' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({});
  }  ngOnInit(): void {
    // Verificar si estamos en modo edición de módulo
    this.route.queryParams.subscribe(params => {
      this.isModuleEditing = params['isModule'] === 'true';
      
      // Obtener valores desde los parámetros de la consulta
      const houseCode = params['houseCode'] || 'CASA-A1';
      const units = params['units'] || '10';
      const moduleIndex = parseInt(params['moduleIndex']) || 0;
      const windowCode = params['windowCode'] || '';
      
      this.moduleIndex = moduleIndex;
      this.moduleCode = this.getModuleCode(windowCode, moduleIndex);
      
      this.initializeForm(houseCode, units);
      
      // Si estamos editando un módulo, recuperar la imagen del módulo desde sessionStorage
      if (this.isModuleEditing) {
        this.loadModuleImageFromStorage();
      }
    });

    // Agregar una fila inicial de perfil y vidrio
    this.addProfileRow();
    this.addGlassConfiguration();
  }

  // Método para generar la letra del módulo (A, B, C, D, etc.)
  getModuleLetter(index: number): string {
    return String.fromCharCode(65 + index); // 65 es el código ASCII para 'A'
  }
  // Método para generar el código completo del módulo
  getModuleCode(baseCode: string, index: number): string {
    return baseCode ? `${baseCode}-${this.getModuleLetter(index)}` : '';
  }
  // Método para cargar la imagen del módulo desde sessionStorage
  private loadModuleImageFromStorage(): void {
    try {
      const storedState = sessionStorage.getItem('multipleWindowState');
      if (storedState) {
        const state = JSON.parse(storedState);
        if (state.modules && state.modules[this.moduleIndex] && state.modules[this.moduleIndex].image) {
          const moduleImage = state.modules[this.moduleIndex].image;
          // Cargar la imagen del módulo en el componente de ventana individual
          this.uploadedImages = [{
            url: moduleImage.url,
            name: moduleImage.name,
            file: moduleImage.file
          }];
        }
      }
    } catch (error) {
      console.error('Error al cargar la imagen del módulo desde sessionStorage:', error);
    }
  }

  // Método para actualizar el estado del módulo en sessionStorage
  private updateModuleStateInStorage(): void {
    try {
      const storedState = sessionStorage.getItem('multipleWindowState');
      if (storedState) {
        const state = JSON.parse(storedState);
        if (state.modules && state.modules[this.moduleIndex]) {
          // Marcar el módulo como configurado
          state.modules[this.moduleIndex].isConfigured = true;
          
          // Actualizar la imagen si se cambió
          if (this.uploadedImages.length > 0) {
            state.modules[this.moduleIndex].image = {
              url: this.uploadedImages[0].url,
              name: this.uploadedImages[0].name,
              file: this.uploadedImages[0].file
            };
          }
          
          // Guardar el estado actualizado
          sessionStorage.setItem('multipleWindowState', JSON.stringify(state));
        }
      }
    } catch (error) {
      console.error('Error al actualizar el estado del módulo en sessionStorage:', error);
    }
  }
  private initializeForm(houseCode: string = 'CASA-A1', units: string = '10'): void {
    const baseControls = {
      houseCode: [{value: houseCode, disabled: false}],
      units: [{value: units, disabled: false}],
      moduleCode: [{value: this.moduleCode, disabled: true}],
      // windowCode y windowQuantity solo son requeridos cuando NO estamos editando un módulo
      windowCode: ['', this.isModuleEditing ? [] : [Validators.required, Validators.pattern('[A-Za-z0-9-]+')]],
      windowQuantity: ['', this.isModuleEditing ? [] : [Validators.required, Validators.min(1)]],
      
      // Dimensiones de diseño
      designWidth: ['', [Validators.required, Validators.min(0.1)]],
      designHeight: ['', [Validators.required, Validators.min(0.1)]],
      totalSurface: [{value: '', disabled: true}],
      
      // Dimensiones de manufactura
      manufacturingWidth: ['', [Validators.required, Validators.min(0.1)]],
      manufacturingHeight: ['', [Validators.required, Validators.min(0.1)]],
      
      // Aperturas
      apertura1: ['', Validators.required],
      apertura2: [''],
      apertura3: [''],
      
      // Cerraduras
      cerradura1: ['', Validators.required],
      cerradura2: [''],
      cerradura3: [''],
      
      // Descripción
      description: ['']
    };

    this.productForm = this.fb.group(baseControls);

    // Suscribirse a cambios en dimensiones para calcular superficie
    this.productForm.get('designWidth')?.valueChanges.subscribe(() => this.calculateSurface());
    this.productForm.get('designHeight')?.valueChanges.subscribe(() => this.calculateSurface());
  }

  // Métodos para manejo de perfiles
  addProfileRow(): void {
    this.profiles.push({
      category: '',
      material: '',
      color: '',
      width: 0,
      height: 0
    });
  }

  removeProfileRow(index: number): void {
    if (this.profiles.length > 1) {
      this.profiles.splice(index, 1);
    }
  }

  // Métodos para manejo de configuraciones de vidrio
  addGlassConfiguration(): void {
    this.glassConfigurations.push({
      type: '',
      protection: '',
      color: '',
      width: 0,
      height: 0,
      length: 0
    });
  }

  removeGlassConfiguration(index: number): void {
    if (this.glassConfigurations.length > 1) {
      this.glassConfigurations.splice(index, 1);
    }
  }

  // Manejo de imágenes
  triggerFileInput(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFile(files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'v') {
      // Manejar pegado desde el portapapeles
      navigator.clipboard.read().then(items => {
        for (const item of items) {
          if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            item.getType(item.types[0]).then(blob => {
              const file = new File([blob], 'pasted-image.png', { type: blob.type });
              this.handleFile(file);
            });
          }
        }
      }).catch(err => {
        console.error('Error al acceder al portapapeles:', err);
      });
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Por favor, selecciona una imagen válida.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.uploadedImages = [{
        url: reader.result as string,
        name: file.name,
        file: file
      }];
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }

  // Cálculos y validaciones
  private calculateSurface(): void {
    const width = this.productForm.get('designWidth')?.value || 0;
    const height = this.productForm.get('designHeight')?.value || 0;
    const surface = width * height;
    this.productForm.patchValue({
      totalSurface: surface.toFixed(2)
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Este campo es requerido';
      }
      if (control.errors['min']) {
        return 'El valor debe ser mayor que 0';
      }
      if (control.errors['pattern']) {
        return 'Formato inválido';
      }
    }
    return '';
  }
  // Métodos de acción del formulario
  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      // Crear objeto con todos los datos
      const formData = {
        ...this.productForm.value,
        profiles: this.profiles,
        glassConfigurations: this.glassConfigurations,
        images: this.uploadedImages
      };

      // TODO: Implementar lógica de guardado
      console.log('Datos a guardar:', formData);
      
      this.successMessage = 'Producto guardado exitosamente';
      
      if (this.isModuleEditing) {
        // Actualizar el estado del módulo en sessionStorage
        this.updateModuleStateInStorage();
        
        // Volver a la vista de ventana múltiple
        this.router.navigate(['/productos/agregar-producto-multiple']);
      } else {
        // Limpiar el formulario para un nuevo producto
        this.productForm.reset();
        this.profiles = [];
        this.glassConfigurations = [];
        this.uploadedImages = [];
        this.addProfileRow();
        this.addGlassConfiguration();
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      this.errorMessage = 'Error al guardar el producto. Por favor, intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }
  onCancel(): void {
    if (this.isModuleEditing) {
      this.router.navigate(['/productos/agregar-producto-multiple']);
    } else {
      this.router.navigate(['/productos']);
    }
  }
}
