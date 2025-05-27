import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { combineLatest, startWith } from 'rxjs';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { FormSectionComponent } from '../../components/forms/form-section/form-section.component';
import { FormButtonsComponent } from '../../components/forms/form-buttons/form-buttons.component';
import { TextInputComponent } from '../../components/forms/text-input/text-input.component';
import { SelectInputComponent } from '../../components/forms/select-input/select-input.component';
import { TextareaInputComponent } from '../../components/forms/textarea-input/textarea-input.component';

import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-add',
  standalone: true,  imports: [
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
  templateUrl: './product-add-window.component.html',
  styleUrl: './product-add-window.component.scss'
})
export class ProductAddComponent implements OnInit {
  pageTitle = 'Agregar Producto';
  productForm!: FormGroup;
  isSubmitting = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Arrays para opciones de select
  windowTypeOptions: Array<{value: string, label: string}> = [];
  materialOptions: Array<{value: string, label: string}> = [];
  locationOptions: Array<{value: string, label: string}> = [];
  glassTypeOptions: Array<{value: string, label: string}> = [];
  opaqueGlassOptions: Array<{value: string, label: string}> = [];
  openingOptions: Array<{value: string, label: string}> = [];
  lockOptions: Array<{value: string, label: string}> = [];

  // Nuevas opciones para los selectores rediseñados
  openingTypeOptions = [
    { value: 'fix', label: 'Fix' },
    { value: 'sliding', label: 'Sliding' },
    { value: 'casement', label: 'Casement' }
  ];
  
  orientationOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'right', label: 'Derecha' },
    { value: 'both', label: 'Ambas' }
  ];
  
  mechanismOptions = [
    { value: 'sliding', label: 'Corredera' },
    { value: 'hinged', label: 'Batiente' }
  ];
  
  finishOptions = [
    { value: 'standard', label: 'Estándar' },
    { value: 'premium', label: 'Premium' }
  ];
  
  lockSystemOptions = [
    { value: 'assa-abloy', label: 'ASSA ABLOY' },
    { value: 'multipoint', label: 'Multipunto' }
  ];
  
  securityLevelOptions = [
    { value: 'basic', label: 'Básico' },
    { value: 'medium', label: 'Medio' },
    { value: 'high', label: 'Alto' }
  ];
  
  lockColorOptions = [
    { value: 'white', label: 'Blanco' },
    { value: 'black', label: 'Negro' },
    { value: 'chrome', label: 'Cromado' }
  ];
  
  profileCategoryOptions = [
    { value: 'frame', label: 'Marco' },
    { value: 'leaf', label: 'Hojas' },
    { value: 'mullion', label: 'Montante' }
  ];
  
  profileMaterialOptions = [
    { value: 'pvc', label: 'PVC' },
    { value: 'aluminum', label: 'Aluminio' },
    { value: 'steel', label: 'Acero' }
  ];
  
  glassTypeNewOptions = [
    { value: 'tempered', label: 'Templado' },
    { value: 'laminated', label: 'Laminado' },
    { value: 'insulated', label: 'Insulado' }
  ];

  // Arrays para campos dinámicos
  profiles: Array<{category: string, width: number, height: number, material: string, color: string}> = [];
  glassConfigurations: Array<{type: string, width: number, height: number, length: number, protection: string, color: string}> = [];
  
  // Propiedades para el uploader
  uploadedImages: Array<{name: string, url: string, file: File}> = [];
  isDragOver = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSelectOptions();
  }  private initializeForm(): void {
    this.productForm = this.fb.group({
      // Información General
      houseCode: ['', [Validators.required, Validators.minLength(2)]],
      units: ['', [Validators.required, Validators.min(1)]],
      windowCode: ['', [Validators.required, Validators.minLength(3)]],
      windowQuantity: ['', [Validators.required, Validators.min(1)]],
      
      // Dimensiones de Diseño
      designWidth: ['', [Validators.required, Validators.min(0.1)]],
      designHeight: ['', [Validators.required, Validators.min(0.1)]],
      totalSurface: [{value: '', disabled: true}],
      
      // Dimensiones de Manufactura
      manufacturingWidth: ['', [Validators.required, Validators.min(0.1)]],
      manufacturingHeight: ['', [Validators.required, Validators.min(0.1)]],
      
      // Tipo de Apertura y Cerradura
      apertura1: ['', Validators.required],
      apertura2: [''],
      apertura3: [''],
      cerradura1: ['', Validators.required],
      cerradura2: [''],
      cerradura3: [''],
      
      // Campos antiguos mantener para compatibilidad si es necesario
      openingType: ['', Validators.required],
      orientation: ['', Validators.required],
      mechanism: ['', Validators.required],
      finish: ['', Validators.required],
      lockSystem: ['', Validators.required],
      securityLevel: ['', Validators.required],
      lockColor: ['', Validators.required],
      
      // Tipo y Material
      windowType: ['', Validators.required],
      material: ['', Validators.required],
      profileSection: ['', Validators.required],
      bodyColor: ['', Validators.required],
      
      // Dimensiones adicionales (ESTOS SON LOS CAMPOS QUE FALTAN)
      width: ['', [Validators.required, Validators.min(1)]],
      height: ['', [Validators.required, Validators.min(1)]],
      depth: [''],
      area: [{value: '', disabled: true}],
      
      // Especificaciones del Vidrio
      glassType: ['', Validators.required],
      glassThickness: ['', [Validators.required, Validators.min(1)]],
      opaqueGlass: [''],
      dvh: [''],
      
      // Funcionalidad
      opening: ['', Validators.required],
      lock: ['', Validators.required],
      mosquitoNet: [''],
      rollerShutter: [''],
      
      // Diseño y Acabados
      frameColor: [''],
      leafColor: [''],
      design: [''],
      laminate: [''],
      
      // Nuevos campos de Diseño
      description: [''],
      technicalNotes: [''],
      
      // Otros campos existentes
      location: ['', Validators.required],
      comments: ['']
    });

    // Inicializar arrays dinámicos
    this.addProfileRow();
    this.addGlassConfiguration();
    
    // Configurar cálculos automáticos
    this.setupSurfaceCalculation();
    this.setupAreaCalculation();
  }private loadSelectOptions(): void {
    // Cargar todas las opciones en paralelo usando forkJoin
    forkJoin({
      windowTypes: this.productService.getWindowTypeOptions(),
      materials: this.productService.getMaterialOptions(),
      locations: this.productService.getLocationOptions(),
      glassTypes: this.productService.getGlassTypeOptions(),
      opaqueGlass: this.productService.getOpaqueGlassOptions(),
      openings: this.productService.getOpeningOptions(),
      locks: this.productService.getLockOptions()
    }).subscribe({
      next: (options) => {
        this.windowTypeOptions = options.windowTypes;
        this.materialOptions = options.materials;
        this.locationOptions = options.locations;
        this.glassTypeOptions = options.glassTypes;
        this.opaqueGlassOptions = options.opaqueGlass;
        this.openingOptions = options.openings;
        this.lockOptions = options.locks;
      },
      error: (error) => {
        console.error('Error al cargar opciones:', error);
        this.errorMessage = 'Error al cargar las opciones del formulario';
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
        const formData = this.productForm.value;
      
      // Convertir valores numéricos
      const productData = {
        ...formData,
        units: formData.units ? parseInt(formData.units) : 0,
        width: parseFloat(formData.width),
        height: parseFloat(formData.height),
        manufacturingWidth: formData.manufacturingWidth ? parseFloat(formData.manufacturingWidth) : undefined,
        manufacturingHeight: formData.manufacturingHeight ? parseFloat(formData.manufacturingHeight) : undefined,
        quantity: parseInt(formData.quantity),
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : 0
      };

      this.productService.createProduct(productData).subscribe({
        next: (product) => {
          console.log('Producto creado exitosamente:', product);
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Error al crear producto:', error);
          this.isSubmitting = false;
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  // Getter para facilitar el acceso a los controles del formulario
  get f() {
    return this.productForm.controls;
  }

  // Métodos para validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  // Método para obtener mensajes de error
  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `No debe exceder los ${maxLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `Valor mínimo: ${control.getError('min').min}`;
    }
    if (control?.hasError('max')) {
      return `Valor máximo: ${control.getError('max').max}`;
    }
    return '';
  }
  // Mantener el método getFieldError para compatibilidad
  getFieldError(fieldName: string): string {
    return this.getErrorMessage(fieldName);
  }

  // Métodos para campos dinámicos
  addProfileRow(): void {
    const newProfile = {
      category: '',
      width: 0,
      height: 0,
      material: '',
      color: ''
    };

    this.profiles.push(newProfile);
  }

  removeProfileRow(index: number): void {
    this.profiles.splice(index, 1);
  }

  addGlassConfiguration(): void {
    const newGlass = {
      type: '',
      width: 0,
      height: 0,
      length: 0,
      protection: '',
      color: ''
    };
    this.glassConfigurations.push(newGlass);
  }

  removeGlassConfiguration(index: number): void {
    this.glassConfigurations.splice(index, 1);
  }

  // Configurar cálculo automático de superficie total
  setupSurfaceCalculation(): void {
    const designWidthControl = this.productForm.get('designWidth');
    const designHeightControl = this.productForm.get('designHeight');
    const totalSurfaceControl = this.productForm.get('totalSurface');

    if (designWidthControl && designHeightControl && totalSurfaceControl) {
      combineLatest([
        designWidthControl.valueChanges.pipe(startWith(designWidthControl.value)),
        designHeightControl.valueChanges.pipe(startWith(designHeightControl.value))
      ]).subscribe(([width, height]) => {
        if (width && height && !isNaN(width) && !isNaN(height)) {
          const surface = width * height;
          totalSurfaceControl.setValue(surface.toFixed(2));
        } else {
          totalSurfaceControl.setValue('');
        }
      });
    }
  }

  // Configurar cálculo automático de área
  setupAreaCalculation(): void {
    const widthControl = this.productForm.get('width');
    const heightControl = this.productForm.get('height');
    const areaControl = this.productForm.get('area');

    if (widthControl && heightControl && areaControl) {
      combineLatest([
        widthControl.valueChanges.pipe(startWith(widthControl.value)),
        heightControl.valueChanges.pipe(startWith(heightControl.value))
      ]).subscribe(([width, height]) => {
        if (width && height && !isNaN(width) && !isNaN(height)) {
          const area = (width * height) / 1000000; // Convertir mm² a m²
          areaControl.setValue(area.toFixed(2));
        } else {
          areaControl.setValue('');
        }
      });
    }
  }

  // Métodos para manejo de archivos
  onFileSelected(event: any): void {
    const files = event.target.files;
    this.handleFiles(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
  }

  private handleFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            this.uploadedImages.push({
              name: file.name,
              url: e.target.result as string,
              file: file
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
  }
}
