### 1. Crear Subcomponentes

#### 1.1. Componente de Título y Botón de Agregar

**Archivo: `takeoff-list-header.component.ts`**
```typescript
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-takeoff-list-header',
  template: `
    <div class="page-header">
      <h1 class="page-title">Gestión de Cubicaciones</h1>
      <button class="btn-add" aria-label="Agregar nueva cubicación" (click)="onAdd()">
        <i class="fas fa-plus" aria-hidden="true"></i>
        AGREGAR CUBICACIÓN
      </button>
    </div>
  `,
  styleUrls: ['./takeoff-list-header.component.scss']
})
export class TakeoffListHeaderComponent {
  @Output() add = new EventEmitter<void>();

  onAdd() {
    this.add.emit();
  }
}
```

#### 1.2. Componente de Tabla

**Archivo: `takeoff-list-table.component.ts`**
```typescript
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-takeoff-list-table',
  template: `
    <div class="table-container">
      <table class="data-table" summary="Listado de cubicaciones con detalles" aria-label="Cubicaciones">
        <thead>
          <tr>
            <th *ngFor="let colId of columnOrder" scope="col" class="sortable">
              <div class="th-content">
                <span>{{ getColumnLabel(colId) }}</span>
                <i *ngIf="colId !== 'actions'" class="fas" [class]="sortColumn === colId ? (sortDirection === 'asc' ? 'fa-caret-up' : 'fa-caret-down') : 'fa-sort'" aria-hidden="true"></i>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of cubicaciones">
            <td *ngFor="let colId of columnOrder">
              <ng-container [ngSwitch]="colId">
                <ng-container *ngSwitchCase="'id'">{{ item.id }}</ng-container>
                <ng-container *ngSwitchCase="'nombre'">{{ item.nombre }}</ng-container>
                <ng-container *ngSwitchCase="'descripcion'">{{ item.descripcion }}</ng-container>
                <ng-container *ngSwitchCase="'fecha'">{{ item.fecha }}</ng-container>
                <ng-container *ngSwitchCase="'estado'">{{ item.estado }}</ng-container>
                <ng-container *ngSwitchCase="'monto'">{{ item.monto }}</ng-container>
                <ng-container *ngSwitchCase="'actions'">
                  <div class="actions-container">
                    <button (click)="edit(item.id)">Edit</button>
                    <button (click)="delete(item.id)">Delete</button>
                  </div>
                </ng-container>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styleUrls: ['./takeoff-list-table.component.scss']
})
export class TakeoffListTableComponent {
  @Input() cubicaciones: any[];
  @Input() columnOrder: string[];
  @Input() sortColumn: string;
  @Input() sortDirection: 'asc' | 'desc';

  edit(id: string) {
    // Emitir evento o llamar a función para editar
  }

  delete(id: string) {
    // Emitir evento o llamar a función para eliminar
  }

  getColumnLabel(colId: string): string {
    // Implementar lógica para obtener la etiqueta de la columna
    return colId;
  }
}
```

#### 1.3. Componente de Filtros

**Archivo: `takeoff-list-filters.component.ts`**
```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-takeoff-list-filters',
  template: `
    <div *ngIf="show">
      <h2>Filtros</h2>
      <div *ngFor="let column of columnOrder">
        <label>{{ getColumnLabel(column) }}</label>
        <input [(ngModel)]="filters[column].value" placeholder="Filtrar...">
      </div>
      <button (click)="applyFilters()">Aplicar</button>
      <button (click)="clearFilters()">Limpiar</button>
    </div>
  `,
  styleUrls: ['./takeoff-list-filters.component.scss']
})
export class TakeoffListFiltersComponent {
  @Input() filters: any;
  @Input() columnOrder: string[];
  @Input() show: boolean;
  @Output() apply = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  applyFilters() {
    this.apply.emit();
  }

  clearFilters() {
    this.clear.emit();
  }

  getColumnLabel(colId: string): string {
    // Implementar lógica para obtener la etiqueta de la columna
    return colId;
  }
}
```

#### 1.4. Componente de Barra de Búsqueda

**Archivo: `takeoff-list-search.component.ts`**
```typescript
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-takeoff-list-search',
  template: `
    <div class="search-container">
      <input type="text" (input)="onSearch($event)" placeholder="Buscar cubicaciones..." aria-label="Buscar cubicaciones">
      <i class="fas fa-search" aria-hidden="true"></i>
    </div>
  `,
  styleUrls: ['./takeoff-list-search.component.scss']
})
export class TakeoffListSearchComponent {
  @Output() search = new EventEmitter<string>();

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.emit(input.value);
  }
}
```

### 2. Actualizar el Componente Principal

**Archivo: `takeoff-list.component.ts`**
```typescript
import { Component, OnInit } from '@angular/core';
import { TakeoffListHeaderComponent } from './takeoff-list-header.component';
import { TakeoffListTableComponent } from './takeoff-list-table.component';
import { TakeoffListFiltersComponent } from './takeoff-list-filters.component';
import { TakeoffListSearchComponent } from './takeoff-list-search.component';

@Component({
  selector: 'app-takeoff-list',
  template: `
    <app-takeoff-list-header (add)="nuevaCubicacion()"></app-takeoff-list-header>
    <app-takeoff-list-search (search)="onSearch($event)"></app-takeoff-list-search>
    <app-takeoff-list-filters [filters]="filters" [columnOrder]="columnOrder" [show]="showFilterMenu" (apply)="applyFilters()" (clear)="clearFilters()"></app-takeoff-list-filters>
    <app-takeoff-list-table [cubicaciones]="cubicaciones" [columnOrder]="columnOrder" [sortColumn]="sortColumn" [sortDirection]="sortDirection"></app-takeoff-list-table>
  `,
  styleUrls: ['./takeoff-list.component.scss']
})
export class TakeoffListComponent implements OnInit {
  // Propiedades y métodos existentes...
}
```

### 3. Resumen

Con esta estructura, hemos creado componentes individuales para el encabezado, la tabla, los filtros y la barra de búsqueda. Esto no solo mejora la legibilidad y la mantenibilidad del código, sino que también permite la reutilización de componentes en otras partes de la aplicación.

### 4. Consideraciones Adicionales

- Asegúrate de importar y declarar los nuevos componentes en el módulo correspondiente.
- Puedes agregar estilos específicos para cada componente en sus respectivos archivos SCSS.
- Implementa la lógica de eventos y métodos necesarios para que los componentes se comuniquen correctamente entre sí.