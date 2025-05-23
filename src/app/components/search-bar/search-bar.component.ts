import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent {
  @Input() placeholder: string = 'Buscar...';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();

  onInputChange(value: string) {
    this.value = value;
    this.searchChange.emit(value);
  }

  onSubmit() {
    this.searchSubmit.emit(this.value);
  }

  clearSearch() {
    this.value = '';
    this.searchChange.emit('');
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement)?.value || '';
  }
}
