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

// Importar servicios necesarios
import { ProductoService } from '../../services/producto.service';
import { CubicacionService } from '../../services/cubicacion.service';
import { ErrorService } from '../../services/error.service';

// Importar enumeraciones y tipos
import { ProductType, GlassType } from '../../pages/product-list/product-list.component';
import { Producto } from '../../interfaces/entities';

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

  // Propiedades para edición
  isEditing = false;
  productId: string | null = null;
  cubicacionId: string | null = null;
  currentProduct: Producto | null = null;

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

  // Agregar enumeraciones para usar en el componente
  productTypes = ProductType;
  glassTypes = GlassType;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private cubicacionService: CubicacionService,
    private errorService: ErrorService
  ) {
    this.productForm = this.fb.group({});
  }

  ngOnInit(): void {
    // Verificar si estamos en modo edición de producto existente
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.productId = params['id'];
        if (this.productId) {
          this.loadProductData(this.productId);
        }
      } else {
        // Verificar si tenemos un ID de cubicación desde los parámetros
        this.cubicacionId = params['cubicacionId'] || null;
        if (this.cubicacionId) {
          this.loadCubicacionData(this.cubicacionId);
        }
      }
    });
    
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

    // Agregar una fila inicial de perfil y vidrio si no estamos editando
    if (!this.isEditing) {
      this.addProfileRow();
      this.addGlassConfiguration();
    }
  }
  // Método para cargar datos de un producto existente
  private async loadProductData(productId: string): Promise<void> {
    try {
      this.currentProduct = await this.productoService.getById(productId);
      
      if (!this.currentProduct) {
        this.errorMessage = 'No se encontró el producto solicitado.';
        return;
      }
      
      // Inicializar el formulario con los datos del producto
      this.initializeForm();
      
      // Actualizar el formulario con los datos existentes
      this.productForm.patchValue({
        windowCode: this.currentProduct.codigo || '',
        windowQuantity: this.currentProduct.cantidad || 1,
        designWidth: this.currentProduct.ancho_diseno || 0,
        designHeight: this.currentProduct.alto_diseno || 0,
        manufacturingWidth: this.currentProduct.ancho_manufactura || 0,
        manufacturingHeight: this.currentProduct.alto_manufactura || 0,
        apertura1: this.currentProduct.apertura_1 || '',
        apertura2: this.currentProduct.apertura_2 || '',
        apertura3: this.currentProduct.apertura_3 || '',
        cerradura1: this.currentProduct.cerradura_1 || '',
        cerradura2: this.currentProduct.cerradura_2 || '',
        cerradura3: this.currentProduct.cerradura_3 || '',
        description: this.currentProduct.descripcion || ''
      });
      
      // Cargar la imagen si existe
      if (this.currentProduct.imagen) {
        this.uploadedImages = [{
          url: this.currentProduct.imagen,
          name: 'Imagen actual',
          file: null as any // No tenemos el File original
        }];
      }
      
      // Recalcular superficie
      this.calculateSurface();
      
      
    
      
    } catch (error) {
      this.errorService.handle(error, 'Cargando datos del producto');
      this.errorMessage = 'Error al cargar los datos del producto. Por favor, intente nuevamente.';
    }
  }

  // Método para cargar datos de una cubicación
  private async loadCubicacionData(cubicacionId: string): Promise<void> {
    try {
      const cubicacion = await this.cubicacionService.getById(cubicacionId);
      
      if (cubicacion) {
        // Actualizar el formulario con información de la cubicación
        this.initializeForm();
        
        if (cubicacion.codigo) {
          this.productForm.patchValue({
            houseCode: cubicacion.codigo
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar datos de cubicación:', error);
    }
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
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.productForm.controls).forEach(key => {
        this.productForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      // Recopilar datos del formulario
      const formValue = this.productForm.getRawValue();
      
      // Verificar si tenemos un cubicacionId
      if (!this.cubicacionId) {
        // Si no hay cubicación, mostrar error y detener el proceso
        this.errorMessage = 'No se puede crear un producto sin una cubicación asociada. Por favor, seleccione una cubicación primero.';
        this.isSubmitting = false;
        return;
      }
      
      // Obtener tipo de vidrio desde el primer elemento de glassConfigurations
      let glassType: GlassType = GlassType.TRANSPARENTE; // Valor por defecto
      if (this.glassConfigurations.length > 0 && this.glassConfigurations[0].type) {
        // Intentar mapear el tipo de vidrio a la enumeración
        switch(this.glassConfigurations[0].type) {
          case 'opaco':
            glassType = GlassType.OPACO;
            break;
          case 'mixto':
            glassType = GlassType.MIXTO;
            break;
          default:
            glassType = GlassType.TRANSPARENTE;
        }
      }
      
      // En lugar de guardar los detalles de perfiles y vidrios como columnas separadas,
      // los guardaremos como parte de la descripción
      const perfilesJson = JSON.stringify(this.profiles);
      const vidriosJson = JSON.stringify(this.glassConfigurations);
      
      // Crear la descripción extendida que incluye la información de perfiles y vidrios
      const descripcionExtendida = formValue.description ? 
        `${formValue.description}\n\n===DATOS TÉCNICOS===\n` : 
        "===DATOS TÉCNICOS===\n";
      
      // Crear objeto de producto para guardar
      const productoData: Partial<Producto> = {
        codigo: formValue.windowCode,
        nombre: `Ventana ${formValue.windowCode}`,
        tipo_producto: ProductType.VENTANA_SIMPLE as any,
        categoria: 'ventanas',
        ubicacion: '',
        cantidad: formValue.windowQuantity,
        ancho_diseno: formValue.designWidth,
        alto_diseno: formValue.designHeight,
        superficie_unitaria: parseFloat(formValue.totalSurface || '0'),
        superficie_total: parseFloat(formValue.totalSurface || '0') * formValue.windowQuantity,
        ancho_manufactura: formValue.manufacturingWidth,
        alto_manufactura: formValue.manufacturingHeight,
        material: this.profiles.length > 0 ? this.profiles[0].material : '',
        seccion_perfil: this.profiles.length > 0 ? `${this.profiles[0].width}x${this.profiles[0].height}` : '',
        color_estructura: this.profiles.length > 0 ? this.profiles[0].color : '',
        espesor_vidrio: this.glassConfigurations.length > 0 ? this.glassConfigurations[0].width.toString() : '',
        proteccion_vidrio: this.glassConfigurations.length > 0 ? this.glassConfigurations[0].protection || '' : '',
        color_pelicula: this.glassConfigurations.length > 0 ? this.glassConfigurations[0].color || '' : '',
        tipo_vidrio: glassType as any,
        tipo_ventana: 'simple',
        tipo_vidrio_detalle: '',
        apertura_1: formValue.apertura1,
        apertura_2: formValue.apertura2,
        apertura_3: formValue.apertura3,
        cerradura_1: formValue.cerradura1,
        cerradura_2: formValue.cerradura2,
        cerradura_3: formValue.cerradura3,
        precio_unitario: 0,
        precio_total: 0,
        factor_instalacion: 1,
        descripcion: `${descripcionExtendida}Perfiles: ${perfilesJson}\nVidrios: ${vidriosJson}`,
        observaciones: `Configuración perfiles: ${perfilesJson.substring(0, 200)}...\nConfiguración vidrios: ${vidriosJson.substring(0, 200)}...`,
        activo: true,
        cubicacion_id: this.cubicacionId, // Siempre incluir cubicacion_id y asegurarse de que tiene valor
        imagen: null
      };

      // Guardar o actualizar el producto según el modo
      let resultado: Producto | null;
      
      if (this.isEditing && this.productId) {
        // Modo actualización
        // En caso de edición, obtener cubicacion_id del producto original
        // si no tenemos uno ya establecido
        if (!this.cubicacionId && this.currentProduct && this.currentProduct.cubicacion_id) {
          productoData.cubicacion_id = this.currentProduct.cubicacion_id;
        }
        
        resultado = await this.productoService.update(this.productId, productoData);
        
        // Si hay una nueva imagen, subirla
        if (this.uploadedImages.length > 0 && this.uploadedImages[0].file) {
          await this.productoService.uploadProductImage(this.productId, this.uploadedImages[0].file);
        }
        
        this.successMessage = 'Producto actualizado exitosamente';
      } else {
        // Modo creación
        resultado = await this.productoService.create(productoData);
        
        if (resultado && resultado.id && this.uploadedImages.length > 0 && this.uploadedImages[0].file) {
          await this.productoService.uploadProductImage(resultado.id, this.uploadedImages[0].file);
        }
        
        this.successMessage = 'Producto creado exitosamente';
      }

      if (!resultado) {
        throw new Error('No se pudo guardar el producto');
      }
      
      if (this.isModuleEditing) {
        // Actualizar el estado del módulo en sessionStorage
        this.updateModuleStateInStorage();
        
        // Volver a la vista de ventana múltiple
        setTimeout(() => {
          this.router.navigate(['/productos/agregar-producto-multiple']);
        }, 1500);
      } else {
        // Volver a la lista de productos o a la cubicación específica
        setTimeout(() => {
          if (this.cubicacionId) {
            this.router.navigate(['/cubicaciones', this.cubicacionId, 'productos']);
          } else {
            this.router.navigate(['/productos']);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      
      // Manejar específicamente el error de violación de not-null constraint
      if (error && typeof error === 'object' && 'code' in error && error.code === '23502') {
        this.errorMessage = 'No se puede crear un producto sin una cubicación asociada. Por favor, seleccione una cubicación válida.';
      } else {
        this.errorService.handle(error, 'Guardando producto');
        this.errorMessage = 'Error al guardar el producto. Por favor, intenta nuevamente.';
      }
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
