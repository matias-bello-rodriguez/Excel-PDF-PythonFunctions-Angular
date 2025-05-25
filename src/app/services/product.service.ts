import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface Product {
  id: string;
  // Información básica
  houseTowerCode: string;
  units: number;
  location: string;
  windowCode: string;
  
  // Tipo y material
  windowType: string;
  material: string;
  profileSection?: string;
  bodyColor?: string;
  
  // Dimensiones
  width: number;
  height: number;
  manufacturingWidth?: number;
  manufacturingHeight?: number;
  quantity: number;
  
  // Especificaciones del vidrio
  glassType?: string;
  glassThickness?: string;
  glassProtection?: string;
  filmColor?: string;
  opaqueClearGlass?: string;
  
  // Funcionalidad
  opening?: string;
  lock?: string;
  
  // Diseño y comentarios
  design1?: string;
  design2?: string;
  comment1?: string;
  comment2?: string;
  comments?: string;
  
  // Cálculos automáticos
  surface?: number;
  unitPrice?: number;
  totalPrice?: number;
  
  // Metadatos
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      id: 'PROD-2024-001',
      houseTowerCode: 'HT-001',
      units: 1,
      windowCode: 'WIN-001',
      location: 'Living Room',
      windowType: 'Sliding',
      width: 1.2,
      height: 1.5,
      manufacturingWidth: 1.25,
      manufacturingHeight: 1.55,
      quantity: 2,
      material: 'Aluminum',
      profileSection: '70x50mm',
      bodyColor: 'White',
      glassType: 'double',
      glassThickness: '6mm',
      glassProtection: 'Tempered',
      filmColor: 'Clear',
      opaqueClearGlass: 'clear',
      opening: 'horizontal',
      lock: 'standard',
      design1: 'Modern minimal',
      design2: 'Clean lines',
      comment1: 'Standard installation',
      comment2: 'Premium quality',
      comments: 'Standard installation with premium finish',
      surface: 3.6,
      unitPrice: 150.00,
      totalPrice: 540.00,
      createdAt: '01/03/2024',
      updatedAt: '01/03/2024'
    },
    {
      id: 'PROD-2024-002',
      houseTowerCode: 'HT-002',
      units: 1,
      windowCode: 'WIN-002',
      location: 'Bedroom',
      windowType: 'Casement',
      width: 1.0,
      height: 1.2,
      manufacturingWidth: 1.05,
      manufacturingHeight: 1.25,
      quantity: 1,
      material: 'PVC',
      profileSection: '60x40mm',
      bodyColor: 'Brown',
      glassType: 'single',
      glassThickness: '4mm',
      glassProtection: 'Standard',
      filmColor: 'Transparent',
      opaqueClearGlass: 'clear',
      opening: 'inward',
      lock: 'multipoint',
      design1: 'Traditional',
      design2: 'Classic style',
      comment1: 'Energy efficient',
      comment2: 'Low maintenance',
      comments: 'Energy efficient with low maintenance requirements',
      surface: 1.2,
      unitPrice: 120.00,
      totalPrice: 144.00,
      createdAt: '02/03/2024',
      updatedAt: '02/03/2024'
    }
  ];

  constructor() { }

  // Obtener todos los productos
  getProducts(): Observable<Product[]> {
    return of(this.products).pipe(delay(300));
  }

  // Obtener un producto por ID
  getProductById(id: string): Observable<Product | undefined> {
    const product = this.products.find(p => p.id === id);
    return of(product).pipe(delay(300));
  }

  // Crear un nuevo producto
  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    const newProduct: Product = {
      ...product,
      id: `PROD-${Date.now()}`,
      surface: product.width * product.height * product.quantity,
      totalPrice: (product.width * product.height * product.quantity) * (product.unitPrice || 0),
      createdAt: new Date().toLocaleDateString('es-ES'),
      updatedAt: new Date().toLocaleDateString('es-ES')
    };
    
    this.products.unshift(newProduct);
    return of(newProduct).pipe(delay(500));
  }

  // Actualizar un producto
  updateProduct(id: string, product: Partial<Product>): Observable<Product | null> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      const updatedProduct = {
        ...this.products[index],
        ...product,
        updatedAt: new Date().toLocaleDateString('es-ES')
      };
      
      // Recalcular superficie y precio si se actualizan dimensiones
      if (product.width || product.height || product.quantity || product.unitPrice) {
        updatedProduct.surface = updatedProduct.width * updatedProduct.height * updatedProduct.quantity;
        updatedProduct.totalPrice = updatedProduct.surface * (updatedProduct.unitPrice || 0);
      }
      
      this.products[index] = updatedProduct;
      return of(updatedProduct).pipe(delay(500));
    }
    return of(null).pipe(delay(500));
  }

  // Eliminar un producto
  deleteProduct(id: string): Observable<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  // Obtener opciones para los selectores
  getWindowTypeOptions(): Observable<Array<{value: string, label: string}>> {
    const windowTypes = [
      { value: 'sliding', label: 'Deslizante' },
      { value: 'casement', label: 'Batiente' },
      { value: 'awning', label: 'Proyectante' },
      { value: 'fixed', label: 'Fijo' },
      { value: 'tilt-turn', label: 'Oscilobatiente' },
      { value: 'folding', label: 'Plegable' }
    ];
    return of(windowTypes);
  }

  getMaterialOptions(): Observable<Array<{value: string, label: string}>> {
    const materials = [
      { value: 'aluminum', label: 'Aluminio' },
      { value: 'pvc', label: 'PVC' },
      { value: 'wood', label: 'Madera' },      { value: 'steel', label: 'Acero' },
      { value: 'fiberglass', label: 'Fibra de Vidrio' }
    ];
    return of(materials);
  }

  getLocationOptions(): Observable<Array<{value: string, label: string}>> {
    const locations = [
      { value: 'living-room', label: 'Sala de Estar' },
      { value: 'bedroom', label: 'Dormitorio' },
      { value: 'kitchen', label: 'Cocina' },
      { value: 'bathroom', label: 'Baño' },
      { value: 'office', label: 'Oficina' },
      { value: 'lobby', label: 'Lobby' },
      { value: 'hallway', label: 'Pasillo' },      { value: 'balcony', label: 'Balcón' },
      { value: 'other', label: 'Otro' }
    ];
    return of(locations);
  }

  getGlassTypeOptions(): Observable<Array<{value: string, label: string}>> {
    const glassTypes = [
      { value: 'single', label: 'Simple' },
      { value: 'double', label: 'Doble' },
      { value: 'triple', label: 'Triple' },
      { value: 'laminated', label: 'Laminado' },
      { value: 'tempered', label: 'Templado' }
    ];
    return of(glassTypes);
  }

  getOpaqueGlassOptions(): Observable<Array<{value: string, label: string}>> {
    const opaqueOptions = [
      { value: 'clear', label: 'Transparente' },
      { value: 'opaque', label: 'Opaco' },
      { value: 'frosted', label: 'Esmerilado' },
      { value: 'tinted', label: 'Tintado' }
    ];
    return of(opaqueOptions);
  }

  getOpeningOptions(): Observable<Array<{value: string, label: string}>> {
    const openingOptions = [
      { value: 'fixed', label: 'Fijo' },
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
      { value: 'inward', label: 'Hacia adentro' },
      { value: 'outward', label: 'Hacia afuera' },
      { value: 'tilt', label: 'Basculante' }
    ];
    return of(openingOptions);
  }

  getLockOptions(): Observable<Array<{value: string, label: string}>> {
    const lockOptions = [
      { value: 'standard', label: 'Estándar' },
      { value: 'multipoint', label: 'Multipunto' },
      { value: 'security', label: 'Seguridad' },
      { value: 'none', label: 'Sin cerradura' }
    ];
    return of(lockOptions);
  }
}
