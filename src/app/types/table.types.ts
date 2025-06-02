
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'actions' | 'boolean' | 'currency' | 'enum' | 'image' | 'link'; // Eliminar 'currency'
  sortable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  enumValues?: string[];

}

export interface TableData {
  id?: string; // Propiedad opcional para el ID
  actions?: string; // Propiedad opcional para acciones
  [key: string]: any; // Permitir cualquier otra propiedad adicional

}
export interface TableFilter {
  type: 'text' | 'date' | 'number' | 'boolean' | 'enum'; // Eliminar 'currency'
  label: string; // Propiedad requerida
  value?: string;
  from?: string | number | null;
  to?: string | number | null;
}

export interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface TableConfig {
  columns: TableColumn[];
  data: TableData[];
  sortConfig?: SortConfig;
  paginationConfig?: PaginationConfig;
  filters?: { [key: string]: TableFilter };
  searchTerm?: string;
  pinnedItems?: Set<string>;
}
