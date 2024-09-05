import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChronologyFilterComponent } from './chronology-filter.component';

describe('ChronologyFilterComponent', () => {
  let component: ChronologyFilterComponent;
  let fixture: ComponentFixture<ChronologyFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChronologyFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChronologyFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
