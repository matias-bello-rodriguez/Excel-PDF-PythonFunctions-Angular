import {
  FileType,
  EntityType,
  HouseType,
  HouseStatus,
  CatalogMaterialType,
  MeasurementUnit,
  ClientType,
  ClientStatus,
  CubicationStatus,
  ProjectMarket,
  ProductType,
  GlassType,
  ContactType,
  ProjectStatus,
  UserRole
} from './types';

export interface Archivo {
  id: string;
  nombre_original: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo_archivo: FileType;
  tipo_mime?: string;
  tamaño?: number;
  tipo_entidad: EntityType;
  entidad_id: string;
  es_principal?: boolean;
  descripcion?: string;
  metadatos?: any;
  subido_por?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface Casa {
  id: string;
  proyecto_id: string;
  numero: number;
  tipo: HouseType;
  metraje?: number;
  estado?: HouseStatus;
  observaciones?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface CatalogoMaterial {
  id: string;
  nombre: string;
  tipo: CatalogMaterialType;
  categoria?: string;
  descripcion?: string;
  proveedor?: string;
  codigo_proveedor?: string;
  precio_unitario?: number;
  unidad_medida?: MeasurementUnit;
  activo?: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface Cliente {
  id: string;
  codigo: string;
  nombre_empresa: string;
  rut?: string;
  tipo_cliente?: ClientType;
  email_contacto?: string;
  telefono_contacto?: string;
  nombre_contacto?: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  pais?: string;
  estado?: ClientStatus;
  observaciones?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface CubicacionDetalle {
  id: string;
  cubicacion_id: string;
  producto_id?: string;
  casa_id?: string;
  item_numero: number;
  descripcion?: string;
  cantidad?: number;
  precio_unitario?: number;
  precio_total?: number;
  observaciones?: string;
  fecha_creacion?: Date;
}

export interface Cubicacion {
  id: string;
  codigo: string;
  nombre: string;
  proyecto_id: string;
  descripcion?: string;
  fecha_cubicacion: Date;
  estado?: CubicationStatus;
  tipo?: ProjectMarket;
  monto_total?: number;
  cantidad_items?: number;
  observaciones?: string;
  creado_por?: string;
  aprobado_por?: string;
  fecha_aprobacion?: Date;
  comentarios_aprobacion?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
  Proyecto?: { nombre: string } | null; 
}

export interface Producto {
  id: string;
  cubicacion_id: string;
  codigo: string;
  nombre: string;
  tipo_producto: ProductType;
  categoria?: string;
  ubicacion?: string;
  cantidad: number;
  ancho_diseno?: number;
  alto_diseno?: number;
  superficie_unitaria?: number;
  superficie_total?: number;
  ancho_manufactura?: number;
  alto_manufactura?: number;
  material?: string;
  seccion_perfil?: string;
  color_estructura?: string;
  espesor_vidrio?: string;
  proteccion_vidrio?: string;
  color_pelicula?: string;
  tipo_vidrio?: GlassType;
  tipo_ventana?: string;
  tipo_vidrio_detalle?: string;
  apertura_1?: string;
  apertura_2?: string;
  apertura_3?: string;
  cerradura_1?: string;
  cerradura_2?: string;
  cerradura_3?: string;
  precio_unitario?: number;
  precio_total?: number;
  factor_instalacion?: number;
  descripcion?: string;
  observaciones?: string;
  activo?: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
  imagen:string | null;

  Cubicacion?: {
    codigo: string;
};
}

export interface ProyectoContacto {
  id: string;
  proyecto_id: string;
  nombre: string;
  cargo?: string;
  email?: string;
  telefono?: string;
  tipo_contacto: ContactType;
  es_principal?: boolean;
  fecha_creacion?: Date;
}

export interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  cliente_id: string;
  descripcion?: string;
  ubicacion?: string;
  ciudad?: string;
  region?: string;
  tipo_mercado: ProjectMarket;
  tipos_obra?: any;
  fecha_inicio?: Date;
  fecha_entrega?: Date;
  fecha_fin_estimada?: Date;
  estado?: ProjectStatus;
  presupuesto?: number;
  monto_real?: number;
  manager_id?: string;
  observaciones?: string;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;

  Cliente?: { id: string; nombre: string } | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol?: UserRole;
  activo?: boolean;
  telefono?: string;
  avatar_url?: string;
  ultimo_login?: Date;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}
