import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.scss'
})
export class TablePaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Input() maxDisplayedPages: number = 5;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getMaxDisplayed(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getFirstItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages() && page !== this.currentPage) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.itemsPerPage = value;
    
    // Ajustar la página actual si es necesario
    const totalPages = this.getTotalPages();
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages || 1;
      this.pageChange.emit(this.currentPage);
    }
    
    this.pageSizeChange.emit(value);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pagesToShow = Math.min(this.maxDisplayedPages, totalPages);
    
    let startPage = Math.max(
      1,
      Math.min(
        this.currentPage - Math.floor(pagesToShow / 2),
        totalPages - pagesToShow + 1
      )
    );
    
    return Array.from({ length: pagesToShow }, (_, i) => startPage + i);
  }

  shouldShowDots(): { start: boolean, end: boolean } {
    const totalPages = this.getTotalPages();
    const pages = this.getPageNumbers();
    
    return {
      start: pages.length > 0 && pages[0] > 1,
      end: pages.length > 0 && pages[pages.length - 1] < totalPages
    };
  }
}
