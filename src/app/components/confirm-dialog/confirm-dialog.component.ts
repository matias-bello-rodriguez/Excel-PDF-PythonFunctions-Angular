import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title || 'Confirmar' }}</h2>
    <mat-dialog-content>
      <p>{{ data.message || '¿Está seguro de realizar esta acción?' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelText || 'Cancelar' }}</button>
      <button mat-button color="primary" [mat-dialog-close]="true">{{ data.confirmText || 'Confirmar' }}</button>
    </mat-dialog-actions>
  `,
  styles: []
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      title?: string;
      message?: string;
      confirmText?: string;
      cancelText?: string;
    },
    public dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}
}