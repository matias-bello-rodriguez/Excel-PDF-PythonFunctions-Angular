import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAddMultipleWindowComponent } from './product-add-multiple-window.component';

describe('ProductAddMultipleWindowComponent', () => {
  let component: ProductAddMultipleWindowComponent;
  let fixture: ComponentFixture<ProductAddMultipleWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAddMultipleWindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAddMultipleWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
