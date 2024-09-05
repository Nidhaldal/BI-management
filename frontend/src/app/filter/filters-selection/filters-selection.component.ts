import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog'; // Import MatDialog
import { PopupService } from '../../popup.service';
import { ChronologyFilterComponent } from '../chronology-filter/chronology-filter.component';

@Component({
  selector: 'app-filters-selection',
  templateUrl: './filters-selection.component.html',
  styleUrls: ['./filters-selection.component.css']
})
export class FiltersSelectionComponent {

  @Input() selectedFile: File | null = null; // Input to receive the selected file from the parent component
  noDataMessage: string = ''; // Add this property for error messages

  constructor(private popupService: PopupService, private dialog: MatDialog) {} // Inject MatDialog

  openSegmentFilter(): void {
    this.popupService.openSegmentsFilter();
  }
  openChronologyFilter(): void {
    // Open the Chronology Filter Modal
    this.dialog.open(ChronologyFilterComponent, {
      width: '600px'
    }).afterClosed().subscribe(result => {
      // Handle result if needed
      console.log('Chronology filter dialog closed with result:', result);
    });
  }
}
