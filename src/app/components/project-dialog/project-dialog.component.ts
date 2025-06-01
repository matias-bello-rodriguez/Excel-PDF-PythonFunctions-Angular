import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { ClienteService } from '../../services/cliente.service';
import { ErrorService } from '../../services/error.service';
import { Proyecto, Cliente } from '../../interfaces/entities';
import { ProjectStatus } from '../../interfaces/types';

@Component({
  selector: 'app-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container" *ngIf="show">
      <h2 class="dialog-title">{{ editMode ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h2>
      <form [formGroup]="projectForm" (ngSubmit)="saveProject()">
        <div class="form-group">
          <mat-form-field appearance="outline">
            <mat-label>Código</mat-label>
            <input matInput formControlName="codigo" placeholder="Ej. PRJ-001">
            <mat-error *ngIf="projectForm.get('codigo')?.hasError('required')">
              El código es requerido
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" placeholder="Nombre del proyecto">
            <mat-error *ngIf="projectForm.get('nombre')?.hasError('required')">
              El nombre es requerido
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline">
            <mat-label>Cliente</mat-label>
            <mat-select formControlName="cliente_id">
              <mat-option *ngFor="let cliente of clientes" [value]="cliente.id">
                {{ cliente.nombre_empresa }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="projectForm.get('cliente_id')?.hasError('required')">
              El cliente es requerido
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline">
            <mat-label>Ubicación</mat-label>
            <input matInput formControlName="ubicacion" placeholder="Ubicación del proyecto">
          </mat-form-field>
        </div>

        <div class="form-row">
          <div class="form-group half">
            <mat-form-field appearance="outline">
              <mat-label>Fecha de inicio</mat-label>
              <input matInput [matDatepicker]="pickerInicio" formControlName="fecha_inicio">
              <mat-datepicker-toggle matSuffix [for]="pickerInicio"></mat-datepicker-toggle>
              <mat-datepicker #pickerInicio></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="form-group half">
            <mat-form-field appearance="outline">
              <mat-label>Fecha de entrega</mat-label>
              <input matInput [matDatepicker]="pickerEntrega" formControlName="fecha_entrega">
              <mat-datepicker-toggle matSuffix [for]="pickerEntrega"></mat-datepicker-toggle>
              <mat-datepicker #pickerEntrega></mat-datepicker>
            </mat-form-field>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half">
            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="planificacion">Planificación</mat-option>
                <mat-option value="en_curso">En Curso</mat-option>
                <mat-option value="revision">Revisión</mat-option>
                <mat-option value="finalizado">Finalizado</mat-option>
                <mat-option value="cancelado">Cancelado</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-group half">
            <mat-form-field appearance="outline">
              <mat-label>Monto</mat-label>
              <input matInput type="number" formControlName="monto_total" placeholder="0">
              <span matPrefix>$&nbsp;</span>
            </mat-form-field>
          </div>
        </div>

        <div class="form-group">
          <mat-form-field appearance="outline">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="descripcion" rows="3"></textarea>
          </mat-form-field>
        </div>

        <div class="dialog-actions">
          <button type="button" mat-button (click)="closeDialog()">Cancelar</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="projectForm.invalid">Guardar</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    .dialog-title {
      margin-top: 0;
      margin-bottom: 24px;
      font-size: 24px;
    }
    .form-group {
      margin-bottom: 16px;
      width: 100%;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .half {
      flex: 1;
    }
    mat-form-field {
      width: 100%;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
  `]
})
export class ProjectDialogComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() project: Proyecto | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Proyecto>>();

  projectForm: FormGroup;
  editMode = false;
  clientes: Cliente[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private errorService: ErrorService
  ) {
    this.projectForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      cliente_id: ['', Validators.required],
      ubicacion: [''],
      fecha_inicio: [null],
      fecha_entrega: [null],
      estado: ['planificacion'],
      monto_total: [0],
      descripcion: ['']
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      // Cargar clientes para el selector
      this.clientes = await this.clienteService.getAll();
      
      // Verificar si estamos editando o creando
      this.editMode = !!this.project;
      
      if (this.project) {
        this.projectForm.patchValue({
          codigo: this.project.codigo || '',
          nombre: this.project.nombre || '',
          cliente_id: this.project.cliente_id || '',
          ubicacion: this.project.ubicacion || '',
          fecha_inicio: this.project.fecha_inicio ? new Date(this.project.fecha_inicio) : null,
          fecha_entrega: this.project.fecha_entrega ? new Date(this.project.fecha_entrega) : null,
          estado: this.project.estado || 'planificacion',
          monto_total: this.project.presupuesto || 0,
          descripcion: this.project.descripcion || ''
        });
      }
    } catch (error) {
      this.errorService.handle(error, 'Cargando datos para el formulario de proyecto');
    } finally {
      this.isLoading = false;
    }
  }

  closeDialog(): void {
    this.close.emit();
  }

  saveProject(): void {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      
      // Convertir fechas a formato ISO
      if (formValue.fecha_inicio instanceof Date) {
        formValue.fecha_inicio = formValue.fecha_inicio.toISOString();
      }
      
      if (formValue.fecha_entrega instanceof Date) {
        formValue.fecha_entrega = formValue.fecha_entrega.toISOString();
      }
      
      const projectData: Partial<Proyecto> = {
        codigo: formValue.codigo,
        nombre: formValue.nombre,
        cliente_id: formValue.cliente_id,
        ubicacion: formValue.ubicacion,
        fecha_inicio: formValue.fecha_inicio,
        fecha_entrega: formValue.fecha_entrega,
        estado: formValue.estado as ProjectStatus,
        presupuesto : formValue.monto_total,
        descripcion: formValue.descripcion
      };
      
      this.save.emit(projectData);
    }
  }
}