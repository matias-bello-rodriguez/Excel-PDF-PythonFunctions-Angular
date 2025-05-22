import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeoffListComponent } from './takeoff-list.component';

describe('TakeoffListComponent', () => {
  let component: TakeoffListComponent;
  let fixture: ComponentFixture<TakeoffListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeoffListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeoffListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
