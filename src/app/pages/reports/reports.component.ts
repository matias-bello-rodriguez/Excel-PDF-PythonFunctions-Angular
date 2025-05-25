import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from '../../components/page-title/page-title.component';
import { ReportsService, ReportKPI, ReportChartData } from '../../services/reports.service';

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
    ChartModule,
    CardModule,
    DividerModule
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  
  // KPIs principales
  kpis: ReportKPI[] = [];
  
  // Datos para gráficos
  m2PorProyectoData: ReportChartData = { labels: [], datasets: [] };
  m2PorClienteData: ReportChartData = { labels: [], datasets: [] };
  cubicacionesPorEstadoData: ReportChartData = { labels: [], datasets: [] };
  m2PorMesData: ReportChartData = { labels: [], datasets: [] };
  
  // Opciones de gráficos
  horizontalBarOptions: any;
  verticalBarOptions: any;
  pieOptions: any;
  donutOptions: any;
  stackedBarOptions: any;

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setChartOptions();
  }

  private loadDashboardData(): void {
    this.reportsService.getDashboardData().subscribe(data => {
      this.kpis = data.kpis;
      this.m2PorProyectoData = data.m2PorProyecto;
      this.m2PorClienteData = data.m2PorCliente;
      this.cubicacionesPorEstadoData = data.cubicacionesPorEstado;
      this.m2PorMesData = data.m2PorMes;
    });
  }

  private setChartOptions(): void {
    // Opciones para gráfico horizontal
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
      }
    };

    // Opciones para gráfico vertical/pastel
    this.verticalBarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'M² por Cliente',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    this.pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'M² por Cliente',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // Opciones para donut
    this.donutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Cubicaciones por Estado',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // Opciones para gráfico apilado
    this.stackedBarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: '#e5e7eb'
          },
          ticks: {
            callback: function(value: any) {
              return value + ' m²';
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'M² por Mes y Tipo',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };
  }
}
