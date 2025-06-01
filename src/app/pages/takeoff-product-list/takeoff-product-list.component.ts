import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CubicacionService } from '@app/services/cubicacion.service';
import { ErrorService } from '../../services/error.service';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { Producto } from '../../interfaces/entities';

@Component({
  selector: 'app-takeoff-product-list',
  templateUrl: './takeoff-product-list.component.html',
  styleUrls: ['./takeoff-product-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    PageTitleComponent,
    SearchBarComponent
  ]
})
export class TakeoffProductListComponent implements OnInit, AfterViewInit {
  cubicacionId: string = '';
  productos: Producto[] = [];
  isLoading: boolean = true;
  connectionError: boolean = false;
  displayedColumns: string[] = ['codigo', 'nombre', 'tipo_producto', 'cantidad', 'superficie_total', 'precio_unitario', 'precio_total', 'acciones'];
  dataSource = new MatTableDataSource<Producto>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cubicacionProductoService: CubicacionService,
    private errorService: ErrorService
  ) {}
  
  ngOnInit() {
    // Obtener el ID de la cubicación de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.cubicacionId = params['id'];
      this.loadProductos();
    });
  }
  
  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }
    async loadProductos() {
    this.isLoading = true;
    
    try {
      console.log('Cargando productos para cubicación ID:', this.cubicacionId);
      
      // Obtener los productos asociados a esta cubicación
      this.productos = await this.cubicacionProductoService.getProductosByCubicacionId(this.cubicacionId);
      
      console.log('Productos cargados:', this.productos.length);
      console.log('Datos de productos:', this.productos);
      
      this.dataSource.data = this.productos;
      this.connectionError = false;
    } catch (error) {
      this.connectionError = true;
      console.error('Error al cargar productos:', error);
      this.errorService.handle(error, 'Cargando productos de cubicación');
    } finally {
      this.isLoading = false;
    }
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  verDetalle(producto: Producto) {
    // Navegar al detalle del producto
    this.router.navigate(['/productos/detalle', producto.id]);
  }
  
  editarProducto(producto: Producto) {
    // Navegar a la edición del producto
    this.router.navigate(['/productos/editar', producto.id]);
  }
  
  volver() {
    // Volver a la lista de cubicaciones
    this.router.navigate(['/cubicaciones']);
  }
}