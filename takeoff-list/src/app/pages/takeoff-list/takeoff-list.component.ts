import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TakeoffHeaderComponent } from './takeoff-header/takeoff-header.component';
import { TakeoffTableComponent } from './takeoff-table/takeoff-table.component';
import { TakeoffFiltersComponent } from './takeoff-filters/takeoff-filters.component';
import { TakeoffColumnMenuComponent } from './takeoff-column-menu/takeoff-column-menu.component';
import { TakeoffSearchComponent } from './takeoff-search/takeoff-search.component';

@Component({
  selector: 'app-takeoff-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TakeoffHeaderComponent,
    TakeoffTableComponent,
    TakeoffFiltersComponent,
    TakeoffColumnMenuComponent,
    TakeoffSearchComponent
  ],
  templateUrl: './takeoff-list.component.html',
  styleUrls: ['./takeoff-list.component.scss']
})
export class TakeoffListComponent implements OnInit {
  // Propiedades y métodos del componente principal
  // ...
}