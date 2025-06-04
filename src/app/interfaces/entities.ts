import { C } from 'node_modules/@angular/cdk/portal-directives.d-BoG39gYN';
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
  nombre?: string;
  proyecto_id?: string;
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
  cubicacion_id?: string;
  codigo?: string;
  ubicacion?: string;
  ancho_m?: number;
  alto_m?: number;
  superficie?: number;
  superficie_total?: number;
  cantidad_por_unidad?: number;
  alto_fabricacion_m?: number;
  ancho_fabricacion_m?: number;
  diseno_1?: string;
  diseno_2?: string;
  comentario_1?: string;
  comentario_2?: string;
  material?: string;
  tipo_vidrio: string;
  tipo_ventana?: string;
  perfil_mm?: string;
  color_body?: string;
  color_film?: string;
  espesor_vidrio_mm?: string;
  opaco_o_transparente?: string;
  apertura?: string;
  cierre?: string;
  proteccion_vidrio?: string;
  precio_unitario_sqm_usd?: number;
  precio_pieza_base_usd?: number;
  precio_total_pieza_usd?: number;
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


export interface ExcelCellInfo {
  value: any;
  backgroundColor: string;
  fontColor: string;
}