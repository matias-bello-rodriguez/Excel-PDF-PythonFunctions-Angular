
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'actions';
  sortable?: boolean;
  draggable?: boolean;
  visible?: boolean;
}

export interface TableData {
  [key: string]: any;
}

export interface TableFilter {
  type: 'text' | 'date' | 'number';
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
