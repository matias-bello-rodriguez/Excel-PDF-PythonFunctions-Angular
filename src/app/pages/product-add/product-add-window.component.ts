import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  // Opciones para los selectores
  windowTypeOptions: Array<{value: string, label: string}> = [];
  materialOptions: Array<{value: string, label: string}> = [];
  locationOptions: Array<{value: string, label: string}> = [];
  glassTypeOptions: Array<{value: string, label: string}> = [];
  opaqueGlassOptions: Array<{value: string, label: string}> = [];
  openingOptions: Array<{value: string, label: string}> = [];
  lockOptions: Array<{value: string, label: string}> = [];

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
      // Información básica
      houseTowerCode: ['', [Validators.required, Validators.minLength(2)]],
      units: ['', [Validators.required, Validators.min(1)]],
      windowCode: ['', [Validators.required, Validators.minLength(3)]],
      location: ['', Validators.required],
      
      // Tipo y material
      windowType: ['', Validators.required],
      material: ['', Validators.required],
      profileSection: ['', Validators.required],
      bodyColor: ['', Validators.required],
      
      // Dimensiones
      width: ['', [Validators.required, Validators.min(1)]],
      height: ['', [Validators.required, Validators.min(1)]],
      depth: [''],
      area: [''],
      
      // Especificaciones del vidrio
      glassType: ['', Validators.required],
      glassThickness: ['', Validators.required],
      opaqueGlass: [''],
      dvh: [''],
      
      // Funcionalidad
      opening: ['', Validators.required],
      lock: ['', Validators.required],
      mosquitoNet: [''],
      rollerShutter: [''],
      
      // Diseño y acabados
      frameColor: [''],
      leafColor: [''],
      design: [''],
      laminate: [''],
      
      // Comentarios
      comments: ['']
    });
  }  private loadSelectOptions(): void {
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
}
