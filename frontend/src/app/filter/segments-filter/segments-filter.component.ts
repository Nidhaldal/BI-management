import { Component, OnInit } from '@angular/core';
import { GraphService } from '../../graph.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { PopupService } from '../../popup.service';

@Component({
  selector: 'app-segments-filter',
  templateUrl: './segments-filter.component.html',
  styleUrls: ['./segments-filter.component.css']
})
export class SegmentsFilterComponent implements OnInit {
  fileOptions: { id: number; name: string }[] = [];
  availableSegmentColumns: string[] = [];
  selectedFileId: number | null = null;
  

  constructor(private graphService: GraphService, private popupService: PopupService) {}

  ngOnInit(): void {
    this.fetchFileOptions();
  }

  fetchFileOptions(): void {
    this.graphService.getAvailableFiles().subscribe(
      response => {
        this.fileOptions = response.files || [];
      },
      error => {
        console.error('Error fetching file options:', error);
      }
    );
  }

  fetchSegmentColumns(): void {
    if (this.selectedFileId !== null) {
      this.graphService.getAvailableSegmentColumns(this.selectedFileId).subscribe(
        response => {
          this.availableSegmentColumns = response.columns || [];
        },
        error => {
          console.error('Error fetching segment columns:', error);
        }
      );
    }
  }

  onFileSelectionChange(fileId: number): void {
    this.selectedFileId = fileId;
    this.fetchSegmentColumns();
  }

  onColumnSelectionChange(event: MatCheckboxChange): void {
    if (this.selectedFileId === null) {
      console.error('No file selected to fetch unique values.');
      return;
    }

    const column = event.source.value;
    if (!column) {
      console.error('Column value missing.');
      return;
    }

    this.graphService.getUniqueValues(this.selectedFileId, column).subscribe(
      response => {
        this.popupService.notifyUniqueValues(column, response.unique_values || []);
      },
      error => {
        console.error('Error fetching unique values:', error);
      }
    );
  }
}
