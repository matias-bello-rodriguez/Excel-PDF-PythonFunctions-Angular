import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { FormSectionComponent } from '../../components/forms/form-section/form-section.component';
import { FormButtonsComponent } from '../../components/forms/form-buttons/form-buttons.component';
import { TextInputComponent } from '../../components/forms/text-input/text-input.component';
import { SelectInputComponent } from '../../components/forms/select-input/select-input.component';
import { TextareaInputComponent } from '../../components/forms/textarea-input/textarea-input.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-add-multiple-window',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormFieldComponent,
    FormSectionComponent,
    FormButtonsComponent,
    TextInputComponent,
    SelectInputComponent,
    TextareaInputComponent
  ],
  templateUrl: './product-add-multiple-window.component.html',
  styleUrl: './product-add-multiple-window.component.scss'
})
export class ProductAddMultipleWindowComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('moduleFileInput') moduleFileInput!: ElementRef;
  @ViewChild('dropzoneElement') dropzoneElement!: ElementRef<HTMLDivElement>;

  productForm!: FormGroup;
  isSubmitting = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Propiedades para el uploader
  uploadedImages: Array<{name: string, url: string, file: File}> = [];
  isDragOver = false;

  // Propiedades para módulos de ventana
  windowModules: Array<{
    code: string,
    image?: {name: string, url: string, file: File},
    isConfigured: boolean
  }> = [];

  currentModuleIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    // Configurar el listener de paste solo si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.setupPasteListener();
    }
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      houseCode: [{value: 'CASA-A1', disabled: false}],
      units: [{value: '10', disabled: false}],
      multipleWindowCode: ['', [Validators.required, Validators.maxLength(50)]],
      multipleWindowQuantity: ['1', [Validators.required, Validators.min(1)]]
    });
  }

  // Métodos para manejo de módulos
  addWindowModule(): void {
    const moduleIndex = this.windowModules.length;
    this.windowModules.push({
      code: this.getModuleCode(moduleIndex),
      isConfigured: false
    });
  }

  removeWindowModule(index: number): void {
    this.windowModules.splice(index, 1);
    // Actualizar códigos de los módulos restantes
    this.windowModules.forEach((module, i) => {
      module.code = this.getModuleCode(i);
    });
  }

  getModuleLetter(index: number): string {
    return String.fromCharCode(97 + index); // 97 es el código ASCII para 'a'
  }

  getModuleCode(index: number): string {
    const baseCode = this.productForm.get('multipleWindowCode')?.value || '';
    return baseCode ? `${baseCode}-${this.getModuleLetter(index)}` : '';
  }

  // Métodos para manejo de imágenes del diseño general
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files.length > 0) {
      this.handleFiles(files);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
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
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.triggerFileInput();
    }
  }

  // Métodos para manejo de imágenes de módulos
  triggerModuleFileInput(moduleIndex: number): void {
    this.currentModuleIndex = moduleIndex;
    this.moduleFileInput.nativeElement.click();
  }

  onModuleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleModuleFile(input.files[0]);
    }
  }

  onModuleDrop(event: DragEvent, moduleIndex: number): void {
    event.preventDefault();
    this.currentModuleIndex = moduleIndex;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleModuleFile(event.dataTransfer.files[0]);
    }
  }

  private handleModuleFile(file: File): void {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string' && this.currentModuleIndex !== null) {
          this.windowModules[this.currentModuleIndex].image = {
            url: reader.result,
            name: file.name,
            file: file
          };
        }
      };
      reader.readAsDataURL(file);
    } else {
      // TODO: Mostrar mensaje de error - solo se permiten imágenes
    }
  }

  removeModuleImage(moduleIndex: number): void {
    if (this.windowModules[moduleIndex]) {
      this.windowModules[moduleIndex].image = undefined;
    }
  }

  // Navegación a la edición de propiedades del módulo
  editModuleProperties(index: number): void {
    const moduleCode = this.getModuleCode(index);
    if (!moduleCode) {
      this.errorMessage = 'Debe ingresar un código de ventana múltiple antes de configurar los módulos';
      return;
    }

    // Guardar el estado actual en sessionStorage
    const currentState = {
      formData: this.productForm.getRawValue(),
      modules: this.windowModules,
      currentModuleIndex: index
    };    sessionStorage.setItem('multipleWindowState', JSON.stringify(currentState));
    
    // Usar la nueva ruta con el moduleId
    this.router.navigate(['/productos/agregar-producto'], {
      queryParams: {
        isModule: true,
        moduleIndex: index,
        moduleCode: moduleCode,
        windowCode: this.productForm.get('multipleWindowCode')?.value,
        parentCode: this.productForm.get('multipleWindowCode')?.value,
        houseCode: this.productForm.get('houseCode')?.value,
        units: this.productForm.get('units')?.value,
        windowQuantity: this.productForm.get('multipleWindowQuantity')?.value,
        returnUrl: '/productos/agregar-producto-multiple'
      }
    });
  }

  // Métodos de validación y utilidad
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (control?.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
      if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    }
    return '';
  }

  private setupPasteListener(): void {
    document.addEventListener('paste', (event: ClipboardEvent) => {
      if (this.dropzoneElement && document.activeElement === this.dropzoneElement.nativeElement) {
        event.preventDefault();
        const items = event.clipboardData?.items;
        
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                this.handleFiles([file]);
              }
            }
          }
        }
      }
    });
}

private handleFiles(files: FileList | File[]): void {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.uploadedImages = [{
        name: file.name,
        url: e.target.result,
        file: file
      }];
    };

    reader.readAsDataURL(file);
}

triggerFileInput(event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
}

removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
}

  // Métodos para submit y cancel
  onSubmit(): void {
    if (this.productForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = new FormData();
      
      // Datos del formulario principal
      const formValue = this.productForm.getRawValue(); // Incluye campos disabled
      Object.keys(formValue).forEach(key => {
        formData.append(key, formValue[key]);
      });

      // Imagen general
      if (this.uploadedImages.length > 0) {
        formData.append('mainImage', this.uploadedImages[0].file);
      }

      // Datos de los módulos
      this.windowModules.forEach((module, index) => {
        formData.append(`modules[${index}].code`, module.code);
        formData.append(`modules[${index}].isConfigured`, module.isConfigured.toString());
        if (module.image) {
          formData.append(`modules[${index}].image`, module.image.file);
        }
      });

      this.productService.saveMultipleWindow(formData).subscribe({
        next: () => {
          this.successMessage = 'Producto guardado exitosamente';
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 1500);
        },
        error: (error) => {
          this.errorMessage = 'Error al guardar el producto: ' + error.message;
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
