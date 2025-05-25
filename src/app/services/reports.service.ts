import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProjectService, Project } from './project.service';
import { TakeoffService, Takeoff } from './takeoff.service';
import { ProductService, Product } from './product.service';

export interface ReportKPI {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: string;
  percentage?: string;
  details?: KPIDetail[];
}

export interface KPIDetail {
  label: string;
  value: string;
  percentage?: string;
}

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ReportChartData {
  labels: string[];
  datasets: ChartDataset[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(
    private projectService: ProjectService,
    private takeoffService: TakeoffService,
    private productService: ProductService
  ) { }
  getKPIs(): Observable<ReportKPI[]> {
    return forkJoin({
      projects: this.projectService.getProjects(),
      takeoffs: this.takeoffService.getTakeoffs(),
      products: this.productService.getProducts()
    }).pipe(
      map(({ projects, takeoffs, products }) => {
        // 1. Calcular total de m² de todos los productos
        const totalM2 = products.reduce((total, product) => {
          const surface = product.surface || (product.width * product.height * product.quantity);
          return total + surface;
        }, 0);

        // 2. Calcular m² por proyecto con detalles
        const m2PorProyecto = new Map<string, number>();
        products.forEach(product => {
          const projectName = this.getProjectFromProduct(product, projects);
          const surface = product.surface || (product.width * product.height * product.quantity);
          m2PorProyecto.set(projectName, (m2PorProyecto.get(projectName) || 0) + surface);
        });

        // Ordenar proyectos por m² (mayor a menor)
        const proyectosOrdenados = Array.from(m2PorProyecto.entries())
          .sort((a, b) => b[1] - a[1]);

        const proyectoConMasM2 = proyectosOrdenados.length > 0 
          ? `${proyectosOrdenados[0][0]}`
          : 'Sin datos';

        const maxM2 = proyectosOrdenados.length > 0 ? proyectosOrdenados[0][1] : 0;

        // 3. Calcular m² por cliente con detalles
        const m2PorCliente = new Map<string, number>();
        products.forEach(product => {
          const cliente = this.getClientFromProduct(product, projects);
          const surface = product.surface || (product.width * product.height * product.quantity);
          m2PorCliente.set(cliente, (m2PorCliente.get(cliente) || 0) + surface);
        });

        const totalClientes = m2PorCliente.size;

        // 4. Calcular estado de cubicaciones con métricas detalladas
        const takeoffsActivos = takeoffs.filter(t => t.estado === 'activo').length;
        const takeoffsCompletados = takeoffs.filter(t => t.estado === 'inactivo').length;
        const totalTakeoffs = takeoffs.length;
        const porcentajeEnProceso = totalTakeoffs > 0 ? (takeoffsActivos / totalTakeoffs * 100) : 0;

        const kpis: ReportKPI[] = [
          {
            title: 'M² Totales Calculados',
            value: totalM2.toFixed(0),
            subtitle: 'metros cuadrados en todos los proyectos',
            icon: 'pi pi-chart-bar',
            color: '#3B82F6',
            trend: `${proyectosOrdenados.length} proyectos activos`,
            details: proyectosOrdenados.slice(0, 5).map(([proyecto, m2]) => ({
              label: proyecto,
              value: `${m2.toFixed(0)} m²`,
              percentage: `${((m2 / totalM2) * 100).toFixed(1)}%`
            }))
          },
          {
            title: 'Proyecto con Mayor Superficie',
            value: proyectoConMasM2,
            subtitle: `${maxM2.toFixed(0)} m² de superficie total`,
            icon: 'pi pi-home',
            color: '#10B981',
            percentage: totalM2 > 0 ? `${((maxM2 / totalM2) * 100).toFixed(1)}%` : '0%',
            details: proyectosOrdenados.slice(0, 3).map(([proyecto, m2], index) => ({
              label: `${index + 1}. ${proyecto}`,
              value: `${m2.toFixed(0)} m²`,
              percentage: `${((m2 / totalM2) * 100).toFixed(1)}%`
            }))
          },
          {
            title: 'Análisis por Cliente',
            value: totalClientes.toString(),
            subtitle: 'clientes con proyectos activos',
            icon: 'pi pi-users',
            color: '#F59E0B',
            trend: `${(totalM2 / totalClientes).toFixed(0)} m² promedio/cliente`,
            details: Array.from(m2PorCliente.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cliente, m2]) => ({
                label: cliente,
                value: `${m2.toFixed(0)} m²`,
                percentage: `${((m2 / totalM2) * 100).toFixed(1)}%`
              }))
          },
          {
            title: 'Estado de Cubicaciones',
            value: `${takeoffsActivos}`,
            subtitle: `de ${totalTakeoffs} cubicaciones en proceso`,
            icon: 'pi pi-cog',
            color: '#EF4444',
            percentage: `${porcentajeEnProceso.toFixed(1)}%`,
            trend: `${takeoffsCompletados} completadas`,
            details: [
              {
                label: 'En Proceso (Activo)',
                value: takeoffsActivos.toString(),
                percentage: `${porcentajeEnProceso.toFixed(1)}%`
              },
              {
                label: 'Completadas (Inactivo)', 
                value: takeoffsCompletados.toString(),
                percentage: `${(100 - porcentajeEnProceso).toFixed(1)}%`
              },
              {
                label: 'Total de Cubicaciones',
                value: totalTakeoffs.toString(),
                percentage: '100%'
              }
            ]
          }
        ];

        return kpis;
      })
    );
  }
  getM2PorProyecto(): Observable<ReportChartData> {
    return forkJoin({
      projects: this.projectService.getProjects(),
      products: this.productService.getProducts()
    }).pipe(
      map(({ projects, products }) => {
        const m2PorProyecto = new Map<string, number>();
        
        // Calcular m² por proyecto
        products.forEach(product => {
          const projectName = this.getProjectFromProduct(product, projects);
          const surface = product.surface || (product.width * product.height * product.quantity);
          m2PorProyecto.set(projectName, (m2PorProyecto.get(projectName) || 0) + surface);
        });

        const labels: string[] = [];
        const data: number[] = [];
        
        m2PorProyecto.forEach((m2, proyecto) => {
          labels.push(proyecto);
          data.push(Math.round(m2));
        });

        const chartData: ReportChartData = {
          labels,
          datasets: [{
            label: 'M² por Proyecto',
            data,
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6',
              '#EC4899',
              '#06B6D4'
            ],
            borderColor: [
              '#2563EB',
              '#059669',
              '#D97706',
              '#DC2626',
              '#7C3AED',
              '#DB2777',
              '#0891B2'
            ],
            borderWidth: 1
          }]
        };

        return chartData;
      })
    );
  }

  getM2PorCliente(): Observable<ReportChartData> {
    return forkJoin({
      projects: this.projectService.getProjects(),
      products: this.productService.getProducts()
    }).pipe(
      map(({ projects, products }) => {
        const m2PorCliente = new Map<string, number>();
        
        // Calcular m² por cliente
        products.forEach(product => {
          const cliente = this.getClientFromProduct(product, projects);
          const surface = product.surface || (product.width * product.height * product.quantity);
          m2PorCliente.set(cliente, (m2PorCliente.get(cliente) || 0) + surface);
        });

        const labels: string[] = [];
        const data: number[] = [];
        
        m2PorCliente.forEach((m2, cliente) => {
          labels.push(cliente);
          data.push(Math.round(m2));
        });

        const chartData: ReportChartData = {
          labels,
          datasets: [{
            data,
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6',
              '#EC4899',
              '#06B6D4'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        };

        return chartData;
      })
    );
  }

  getCubicacionesPorEstado(): Observable<ReportChartData> {
    return this.takeoffService.getTakeoffs().pipe(
      map(takeoffs => {
        const activos = takeoffs.filter(t => t.estado === 'activo').length;
        const inactivos = takeoffs.filter(t => t.estado === 'inactivo').length;

        const data: ReportChartData = {
          labels: ['En Proceso', 'Completadas'],
          datasets: [{
            data: [activos, inactivos],
            backgroundColor: [
              '#F59E0B', // Amarillo para en proceso
              '#10B981'  // Verde para completadas
            ],
            borderColor: '#ffffff',
            borderWidth: 3
          }]
        };

        return data;
      })
    );
  }

  getM2PorMes(): Observable<ReportChartData> {
    return forkJoin({
      projects: this.projectService.getProjects(),
      products: this.productService.getProducts()
    }).pipe(
      map(({ projects, products }) => {
        // Para esta demo, vamos a simular datos por mes basados en los tipos de obra
        const tiposObra = ['residencial', 'comercial', 'industrial', 'institucional'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        
        // Calcular total de m² por tipo de obra
        const m2PorTipo = new Map<string, number>();
        
        products.forEach(product => {
          const project = this.getProjectObjectFromProduct(product, projects);
          const surface = product.surface || (product.width * product.height * product.quantity);
          
          if (project) {
            project.tiposObra.forEach(tipo => {
              m2PorTipo.set(tipo, (m2PorTipo.get(tipo) || 0) + surface);
            });
          }
        });

        const datasets: ChartDataset[] = [];
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
        
        tiposObra.forEach((tipo, index) => {
          const totalM2 = m2PorTipo.get(tipo) || 0;
          // Distribuir los m² a lo largo de los meses (simulación)
          const monthlyData = meses.map((_, monthIndex) => {
            return Math.round(totalM2 * (0.1 + Math.random() * 0.2));
          });

          datasets.push({
            label: tipo.charAt(0).toUpperCase() + tipo.slice(1),
            data: monthlyData,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            borderWidth: 1
          });
        });

        const data: ReportChartData = {
          labels: meses,
          datasets
        };

        return data;
      })
    );
  }

  // Método para obtener todos los datos del dashboard de una vez
  getDashboardData(): Observable<{
    kpis: ReportKPI[];
    m2PorProyecto: ReportChartData;
    m2PorCliente: ReportChartData;
    cubicacionesPorEstado: ReportChartData;
    m2PorMes: ReportChartData;
  }> {
    return forkJoin({
      kpis: this.getKPIs(),
      m2PorProyecto: this.getM2PorProyecto(),
      m2PorCliente: this.getM2PorCliente(),
      cubicacionesPorEstado: this.getCubicacionesPorEstado(),
      m2PorMes: this.getM2PorMes()
    });
  }

  // Métodos auxiliares para relacionar datos
  private getProjectFromProduct(product: Product, projects: Project[]): string {
    // Lógica simple para asociar productos con proyectos
    // En una app real, esto estaría en la base de datos
    const projectsByLocation = projects.find(p => 
      product.location?.toLowerCase().includes(p.ubicacion.toLowerCase()) ||
      p.nombre.toLowerCase().includes(product.location?.toLowerCase() || '')
    );
    
    return projectsByLocation?.nombre || 'Proyecto General';
  }

  private getProjectObjectFromProduct(product: Product, projects: Project[]): Project | null {
    const projectsByLocation = projects.find(p => 
      product.location?.toLowerCase().includes(p.ubicacion.toLowerCase()) ||
      p.nombre.toLowerCase().includes(product.location?.toLowerCase() || '')
    );
    
    return projectsByLocation || null;
  }

  private getClientFromProduct(product: Product, projects: Project[]): string {
    const project = this.getProjectObjectFromProduct(product, projects);
    return project?.cliente || 'Cliente General';
  }
}
