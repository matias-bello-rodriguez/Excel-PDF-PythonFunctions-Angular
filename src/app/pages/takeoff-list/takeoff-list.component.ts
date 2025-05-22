import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Importa Router si necesitas navegación
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'; // Importa FontAwesomeModule si usas iconos
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-takeoff-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule
  ],
  templateUrl: './takeoff-list.component.html',
  styleUrl: './takeoff-list.component.scss'
})
export class TakeoffListComponent {  columnOrder: string[] = ['id', 'nombre', 'descripcion', 'fecha', 'estado', 'monto', 'actions'];
  draggedColumn: string | null = null;
  
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0; // Inicializar con 0 o cargar desde un servicio

  // Define interface for cubicacion objects
  cubicaciones: Array<{
    id: string;
    nombre: string;
    descripcion: string;
    fecha: string;
    estado: string;
    monto: string;
    [key: string]: string; // Add index signature to allow dynamic property access
  }> = [
    {
      id: 'CUB-2023-001',
      nombre: 'Torre Central',
      descripcion: 'Cubicación estructura principal',
      fecha: '15/05/2023',
      estado: 'activo',
      monto: '$48.370.000'
    },
    {
      id: 'CUB-2023-002',
      nombre: 'Edificio Norte',
      descripcion: 'Cubicación terminaciones',
      fecha: '22/05/2023',
      estado: 'activo',
      monto: '$73.290.500'
    },
    {
      id: 'CUB-2023-003',
      nombre: 'Bodega Industrial',
      descripcion: 'Cubicación prefabricados',
      fecha: '30/05/2023',
      estado: 'inactivo',
      monto: '$88.560.750'
    }
    // ... más datos si es necesario
  ];
  constructor() {
    this.totalItems = this.cubicaciones.length; // Asignar el total de items
  }

  // Métodos para manejar acciones
  nuevaCubicacion() {
    console.log('Creando nueva cubicación desde TakeoffListComponent');
    // Lógica para añadir una nueva cubicación
  }

  editar(id: string) {
    console.log(`Editando cubicación ${id} desde TakeoffListComponent`);
    // Lógica para editar
  }

  eliminar(id: string) {
    console.log(`Eliminando cubicación ${id} desde TakeoffListComponent`);
    // Lógica para eliminar
  }

  sortTable(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // Lógica para ordenar los datos de this.cubicaciones
    this.cubicaciones.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return this.sortDirection === 'asc' ? comparison : comparison * -1;
    });
  }

  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.itemsPerPage = parseInt(target.value, 10);
      this.currentPage = 1; // Reset to first page
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  onDragStart(event: DragEvent, columnId: string) {
    if (columnId === 'id') return;
    this.draggedColumn = columnId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', columnId);
    }
  }

  onDragOver(event: DragEvent, columnId: string) {
    if (columnId === 'id' || !this.draggedColumn) return;
    event.preventDefault();
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.remove('drag-over');
    }
  }

  onDrop(event: DragEvent, targetColumnId: string) {
    event.preventDefault();
    if (targetColumnId === 'id' || !this.draggedColumn) return;

    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      th.classList.remove('drag-over');
    }

    const fromIndex = this.columnOrder.indexOf(this.draggedColumn);
    const toIndex = this.columnOrder.indexOf(targetColumnId);

    if (fromIndex !== -1 && toIndex !== -1) {
      this.columnOrder = Array.from(this.columnOrder);
      this.columnOrder.splice(fromIndex, 1);
      this.columnOrder.splice(toIndex, 0, this.draggedColumn);
    }

    this.draggedColumn = null;
  }

  onDragEnd() {
    this.draggedColumn = null;
    document.querySelectorAll('th.drag-over').forEach(th => {
      th.classList.remove('drag-over');
    });
  }
}
