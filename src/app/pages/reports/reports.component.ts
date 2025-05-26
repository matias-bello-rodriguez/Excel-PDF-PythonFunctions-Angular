import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { AddButtonComponent } from '../../components/add-button/add-button.component';
import { ReportsService, ReportKPI, ReportChartData } from '../../services/reports.service';

// Extended interface for mixed chart types
interface MixedChartData extends ReportChartData {
  datasets: Array<{
    type?: string;
    label?: string; // Cambiado a opcional
    backgroundColor: string | string[];
    data: number[];
    borderWidth?: number;
    hoverBackgroundColor?: string | string[];
  }>;
}

// PrimeNG imports
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    AddButtonComponent,
    ChartModule,
    CardModule,
    DividerModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  pageTitle: string = 'Reportes y Análisis';
  
  // Datos para gráficos
  m2PorProyectoData: ReportChartData = { labels: [], datasets: [] };
  m2PorClienteData: ReportChartData = { labels: [], datasets: [] };
  cubicacionesPorEstadoData: MixedChartData = { labels: [], datasets: [] };
  m2PorMesData: ReportChartData = { labels: [], datasets: [] }; // Añadir esta propiedad
  
  // KPI del proyecto con más m²
  proyectoConMasM2: {
    nombre: string;
    m2: number;
    porcentaje: string;
  } = { nombre: '', m2: 0, porcentaje: '' };
  
  // Estados de cubicaciones como contadores
  estadosCubicaciones: {
    realizadas: number;
    activas: number;
    rechazadas: number;
  } = { realizadas: 0, activas: 0, rechazadas: 0 };
  
  // Opciones de gráficos
  horizontalBarOptions: any;
  verticalBarOptions: any;
  donutOptions: any;
  kpis: any[] = [];

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setChartOptions();
  }

  // Método para simular datos si el servicio aún no está implementado
  private loadMockData(): void {
    // Datos de proyectos
    const proyectos = [
      { nombre: 'Edificio Central Park', m2: 12450, ubicacion: 'Santiago Centro' },
      { nombre: 'Torre Titanium', m2: 9876, ubicacion: 'Las Condes' },
      { nombre: 'Residencial Los Álamos', m2: 7823, ubicacion: 'Providencia' },
      { nombre: 'Condominio Vista Hermosa', m2: 6540, ubicacion: 'Viña del Mar' },
      { nombre: 'Oficinas Costanera Center', m2: 5230, ubicacion: 'Vitacura' },
      { nombre: 'Mall Plaza Oeste', m2: 4920, ubicacion: 'Maipú' },
      { nombre: 'Hospital del Valle', m2: 3870, ubicacion: 'La Florida' }
    ];

    // Datos de clientes
    const clientes = [
      { nombre: 'Constructora Aconcagua', m2: 18630, proyectos: 3 },
      { nombre: 'Inmobiliaria El Bosque', m2: 11245, proyectos: 2 },
      { nombre: 'Grupo Arauco', m2: 9780, proyectos: 2 },
      { nombre: 'Desarrollo Urbano SA', m2: 7200, proyectos: 1 },
      { nombre: 'Consorcio Hospital', m2: 3870, proyectos: 1 }
    ];

    // Estados de cubicaciones
    const cubicaciones = {
      realizadas: 27,
      activas: 14,
      rechazadas: 5
    };

    // Datos históricos por mes (últimos 6 meses)
    const mesesLabels = ['Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre'];
    const datosMensuales = {
      obra_gruesa: [2340, 2780, 3150, 4200, 3920, 4560],
      terminaciones: [1870, 2340, 2100, 2650, 3100, 3450],
      instalaciones: [980, 1240, 1560, 1830, 2150, 2340]
    };

    // Configurar datos para gráfico de proyectos
    this.m2PorProyectoData = {
      labels: proyectos.map(p => p.nombre),
      datasets: [
        {
          label: 'Metros cuadrados',
          data: proyectos.map(p => p.m2),
          backgroundColor: [
            '#4361EE', '#3A0CA3', '#4895EF', '#4CC9F0', '#560BAD', '#7209B7', '#F72585'
          ],
          borderWidth: 0
        }
      ]
    };

    // Configurar datos para gráfico de clientes
    this.m2PorClienteData = {
      labels: clientes.map(c => c.nombre),
      datasets: [
        {
          label: 'Metros cuadrados',
          data: clientes.map(c => c.m2),
          backgroundColor: [
            '#4CC9F0', '#4895EF', '#4361EE', '#3F37C9', '#3A0CA3'
          ],
          borderWidth: 0
        }
      ]
    };

    // Configurar datos para estados de cubicaciones
    this.cubicacionesPorEstadoData = {
      labels: ['Realizadas', 'Activas', 'Rechazadas'],
      datasets: [
        {
          label: 'Estados de Cubicaciones',
          data: [cubicaciones.realizadas, cubicaciones.activas, cubicaciones.rechazadas],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          hoverBackgroundColor: ['#059669', '#d97706', '#dc2626']
        }
      ]
    };

    // Actualizar contadores de cubicaciones
    this.estadosCubicaciones = cubicaciones;

    // Obtener proyecto con más metros cuadrados
    const proyectoMaximo = proyectos.reduce((prev, current) => 
      (prev.m2 > current.m2) ? prev : current
    );
    
    const totalM2 = proyectos.reduce((sum, p) => sum + p.m2, 0);
    const porcentaje = ((proyectoMaximo.m2 / totalM2) * 100).toFixed(1) + '%';

    this.proyectoConMasM2 = {
      nombre: proyectoMaximo.nombre,
      m2: proyectoMaximo.m2,
      porcentaje: porcentaje
    };

    // Añadir KPIs adicionales
    this.kpis = [
      {
        title: 'Total de Proyectos',
        value: proyectos.length.toString(),
        subtitle: `${totalM2.toLocaleString()} m² totales`,
        icon: 'pi pi-building',
        color: '#4361ee',
        percentage: '+12%',
        trend: 'vs mes anterior',
        details: [
          { label: 'Proyectos residenciales', value: '4', percentage: '+8%' },
          { label: 'Proyectos comerciales', value: '3', percentage: '+20%' }
        ]
      },
      {
        title: 'Total de Clientes',
        value: clientes.length.toString(),
        subtitle: 'Activos en el sistema',
        icon: 'pi pi-users',
        color: '#7209b7',
        percentage: '+5%',
        trend: 'vs mes anterior',
        details: [
          { label: 'Clientes premium', value: '2', percentage: '+0%' },
          { label: 'Clientes estándar', value: '3', percentage: '+50%' }
        ]
      },
      {
        title: 'Cubicaciones',
        value: (cubicaciones.realizadas + cubicaciones.activas + cubicaciones.rechazadas).toString(),
        subtitle: 'Total registradas',
        icon: 'pi pi-file',
        color: '#f72585',
        percentage: '+18%',
        trend: 'vs mes anterior',
        details: [
          { label: 'Realizadas', value: cubicaciones.realizadas.toString(), percentage: '+22%' },
          { label: 'Activas', value: cubicaciones.activas.toString(), percentage: '+16%' },
          { label: 'Rechazadas', value: cubicaciones.rechazadas.toString(), percentage: '-10%' }
        ]
      }
    ];

    // Datos de M² por mes y tipo (completo con los 3 conjuntos de datos)
    this.m2PorMesData = {
      labels: mesesLabels,
      datasets: [
        {
          // @ts-expect-error: 'type' es válido para gráficos mixtos
          type: 'bar',
          label: 'Obra gruesa',
          backgroundColor: '#4361EE',
          data: datosMensuales.obra_gruesa
        },
        {
          // @ts-expect-error: 'type' es válido para gráficos mixtos
          type: 'bar',
          label: 'Terminaciones',
          backgroundColor: '#7209B7',
          data: datosMensuales.terminaciones
        },
        {
          // @ts-expect-error: 'type' es válido para gráficos mixtos
          type: 'bar',
          label: 'Instalaciones',
          backgroundColor: '#F72585',
          data: datosMensuales.instalaciones
        }
      ]
    };
  }

  private loadDashboardData(): void {
    // Intentamos cargar datos del servicio
    this.reportsService.getDashboardData().subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.m2PorProyectoData = data.m2PorProyecto;
        this.m2PorClienteData = data.m2PorCliente;
        this.cubicacionesPorEstadoData = data.cubicacionesPorEstado;
          
        // Obtener el proyecto con más metros cuadrados
        if (data.m2PorProyecto && data.m2PorProyecto.labels && data.m2PorProyecto.datasets) {
          const dataset = data.m2PorProyecto.datasets[0];
          const maxIndex = dataset.data.indexOf(Math.max(...dataset.data));
          const totalM2 = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
          const maxM2 = dataset.data[maxIndex] || 0;
          const porcentaje = totalM2 > 0 ? ((maxM2 / totalM2) * 100).toFixed(1) + '%' : '0%';

          this.proyectoConMasM2 = {
            nombre: data.m2PorProyecto.labels[maxIndex] || '',
            m2: maxM2,
            porcentaje: porcentaje
          };
        }

        // Procesar estados de cubicaciones
        if (data.cubicacionesPorEstado && data.cubicacionesPorEstado.datasets) {
          const dataset = data.cubicacionesPorEstado.datasets[0];
          const labels = data.cubicacionesPorEstado.labels || [];
          
          labels.forEach((label: string, index: number) => {
            if (label.toLowerCase().includes('realizada'))
              this.estadosCubicaciones.realizadas = dataset.data[index] || 0;
            else if (label.toLowerCase().includes('activa'))
              this.estadosCubicaciones.activas = dataset.data[index] || 0;
            else if (label.toLowerCase().includes('rechazada'))
              this.estadosCubicaciones.rechazadas = dataset.data[index] || 0;
          });
        }
      },
      error: (err) => {
        console.warn('Error al cargar datos del servicio, usando datos de prueba', err);
        this.loadMockData();
      }
    });
  }

  private setChartOptions(): void {
    // Opciones para gráfico horizontal (m² por proyecto)
    this.horizontalBarOptions = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'M² por Proyecto',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return context.raw + ' m²';
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            callback: function(value: any) {
              return value + ' m²';
            }
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: function(value: any) {
          return value + ' m²';
        }
      }
    };

    // Opciones para gráfico vertical (m² por cliente)
    this.verticalBarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'M² por Cliente',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return context.raw + ' m²';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            callback: function(value: any) {
              return value + ' m²';
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: function(value: any) {
          return value + ' m²';
        }
      }
    };

    // Opciones para donut (estados de cubicaciones)
    this.donutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true
          }
        },
        title: {
          display: true,
          text: 'Estados de Cubicaciones',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
              const valor = context.raw;
              const porcentaje = ((valor / total) * 100).toFixed(1);
              return `${valor} (${porcentaje}%)`;
            }
          }
        }
      }
    };
  }

  exportarDatos(): void {
    // Implementar lógica de exportación de reportes
    console.log('Exportando datos de reportes...');
  }
}
