import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltersSelectionComponent } from './filters-selection.component';

describe('FiltersSelectionComponent', () => {
  let component: FiltersSelectionComponent;
  let fixture: ComponentFixture<FiltersSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FiltersSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltersSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
