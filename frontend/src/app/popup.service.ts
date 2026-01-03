import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog'; 
import { BehaviorSubject } from 'rxjs';
import { SegmentsFilterComponent } from './filter/segments-filter/segments-filter.component';
import { ChronologyFilterComponent } from './filter/chronology-filter/chronology-filter.component';
import { FiltersSelectionComponent } from './filter/filters-selection/filters-selection.component';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupTypeSubject = new BehaviorSubject<'none' | 'upload' | 'import' | 'choose'>('none');
  popupType$ = this.popupTypeSubject.asObservable();

  private uniqueValuesSubject = new BehaviorSubject<{ column: string, uniqueValues: any[] } | null>(null);
  uniqueValues$ = this.uniqueValuesSubject.asObservable();
  private chronologyFilterSubject = new BehaviorSubject<any>(null);
  chronologyFilter$ = this.chronologyFilterSubject.asObservable();

  constructor(private dialog: MatDialog) {}

  openChoosePopup(): void {
    console.log('Opening choose popup');
    this.popupTypeSubject.next('choose');
    console.log('Current popup type:', this.popupTypeSubject.value); // Debugging
  }
  
  openUploadPopup(): void {
    console.log('Opening upload popup');
    this.popupTypeSubject.next('upload');
  }
  
  openFiltersSelectionPopup(): void {
    console.log('Opening filters selection popup');
    this.dialog.open(FiltersSelectionComponent, {
      width: '400px',
    });
  }

  openImportPopup(): void {
    console.log('Opening import popup');
    this.popupTypeSubject.next('import');
  }

  openSegmentsFilter(): void {
    console.log('Opening Segments Filter Modal');
    this.dialog.open(SegmentsFilterComponent, {
      width: '500px',
      height: '600px',
      panelClass: 'segments-filter-dialog'
    });
  }
  
  openChronologyFilter(file: File | null): void {
    this.dialog.open(ChronologyFilterComponent, {
      width: '600px',
      data: { file: file } 
    });
  }
  

  closePopup(): void {
    console.log('Closing popup');
    this.popupTypeSubject.next('none');
    this.dialog.closeAll();
  }

  notifyUniqueValues(column: string, uniqueValues: any[]): void {
    this.uniqueValuesSubject.next({ column, uniqueValues });
  }
  notifyChronologyFilter(data: any) {
    this.chronologyFilterSubject.next(data);
  }

}
