import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog'; 
import { PopupService } from '../../popup.service';
import { ChronologyFilterComponent } from '../chronology-filter/chronology-filter.component';

@Component({
  selector: 'app-filters-selection',
  templateUrl: './filters-selection.component.html',
  styleUrls: ['./filters-selection.component.css']
})
export class FiltersSelectionComponent {

  @Input() selectedFile: File | null = null; 
  noDataMessage: string = '';

  constructor(private popupService: PopupService, private dialog: MatDialog) {} 

  openSegmentFilter(): void {
    this.popupService.openSegmentsFilter();
  }
  openChronologyFilter(): void {
    this.dialog.open(ChronologyFilterComponent, {
      width: '600px'
    }).afterClosed().subscribe(result => {
      console.log('Chronology filter dialog closed with result:', result);
    });
  }
}
