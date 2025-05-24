import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeoffAddComponent } from './takeoff-add.component';

describe('TakeoffAddComponent', () => {
  let component: TakeoffAddComponent;
  let fixture: ComponentFixture<TakeoffAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeoffAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeoffAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
