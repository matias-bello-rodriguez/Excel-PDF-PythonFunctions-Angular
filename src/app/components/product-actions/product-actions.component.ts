import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-product-actions',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './product-actions.component.html',
  styleUrls: ['./product-actions.component.scss']
})
export class ProductActionsComponent {
  @Input() productId!: string;
  @Input() productName?: string;
  @Input() isPinned: boolean = false;
  @Input() showEdit: boolean = true;
  @Input() showDelete: boolean = true;
  @Input() showPin: boolean = true;
  @Input() showDetail: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() confirmDelete: boolean = true;

  @Output() editProduct = new EventEmitter<string>();
  @Output() deleteProduct = new EventEmitter<string>();
  @Output() pinProduct = new EventEmitter<string>();
  @Output() viewDetail = new EventEmitter<string>();

  onEdit(event: Event): void {
    event.stopPropagation();
    if (!this.isLoading) {
      this.editProduct.emit(this.productId);
    }
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    if (!this.isLoading) {
      this.deleteProduct.emit(this.productId);
    }
  }

  onPin(event: Event): void {
    event.stopPropagation();
    if (!this.isLoading) {
      this.pinProduct.emit(this.productId);
    }
  }

  onViewDetail(event: Event): void {
    event.stopPropagation();
    if (!this.isLoading) {
      this.viewDetail.emit(this.productId);
    }
  }

  getTooltipText(action: string): string {
    const name = this.productName ? ` ${this.productName}` : '';
    
    switch (action) {
      case 'edit':
        return `Editar producto${name}`;
      case 'delete':
        return `Eliminar producto${name}`;
      case 'pin':
        return this.isPinned ? `Desfijar producto${name}` : `Fijar producto${name}`;
      case 'detail':
        return `Ver detalles del producto${name}`;
      default:
        return '';
    }
  }

  getAriaLabel(action: string): string {
    return this.getTooltipText(action);
  }
}
