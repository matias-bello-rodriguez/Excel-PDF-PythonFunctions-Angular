export interface TableColumn {
  key: string;
  title: string;
  visible: boolean;
  sortable?: boolean;
  type?: string;
  width?: string;
  fixed?: boolean;
}

export interface TableFilter {
  field: string;
  value: any;
  operator: string;
}

export interface Producto {
  id?: string;
  codigo?: string;
  cubicacion_id?: string;
  ubicacion?: string;
  ancho_diseno?: number;
  alto_diseno?: number;
  superficie_unitaria?: number;
  cantidad?: number;
  superficie_total?: number;
  precio_unitario?: number;
  precio_total?: number;
  material?: string;
  tipo_producto?: string;
  tipo_perfil?: string;
  tipo_vidrio?: string;
  color_estructura?: string;
  espesor_vidrio?: string;
  tipo_apertura?: string;
  imagen?: string;
  observaciones?: string;
  activo?: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface CubicacionInfo {
  id: string;
  codigo: string;
  nombre: string;
  proyecto?: string;
}
