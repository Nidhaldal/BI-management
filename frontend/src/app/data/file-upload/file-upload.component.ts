import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { PopupService } from '../../popup.service'; // Import the PopupService
import { Subscription } from 'rxjs';
import { GraphService } from '../../graph.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent implements OnInit, OnDestroy {
  selectedFiles: File[] = [];
  showPopup: boolean = false;
  showFileUpload: boolean = false;
  showChoosePopup: boolean = false;
  popupSubscription!: Subscription;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() validateFiles = new EventEmitter<void>();

  constructor(private popupService: PopupService, private graphService: GraphService) {}

  ngOnInit(): void {
    this.popupSubscription = this.popupService.popupType$.subscribe(type => {
      console.log('Popup type received:', type);
      this.showPopup = type !== 'none';
      this.showFileUpload = type === 'upload';
      this.showChoosePopup = type === 'choose';
      console.log('showPopup:', this.showPopup);
      console.log('showFileUpload:', this.showFileUpload);
      console.log('showChoosePopup:', this.showChoosePopup);
    });
  }
  
  
  ngOnDestroy(): void {
    if (this.popupSubscription) {
      this.popupSubscription.unsubscribe();
    }
  }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.files) {
      const filesArray = Array.from(input.files);
      this.selectedFiles.push(...filesArray); // Append new files to the list
      this.filesSelected.emit(this.selectedFiles); // Emit the updated file list
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filesSelected.emit(this.selectedFiles);
  }

  reset(): void {
    this.selectedFiles = [];
    this.filesSelected.emit(this.selectedFiles);
  }

  onValidate(): void {
    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file); // Ensure 'file' matches the backend key
    });
  
    // Debugging: Check contents of FormData
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
  
    this.graphService.uploadFiles(this.selectedFiles).subscribe(
      response => {
        console.log('Files uploaded successfully', response);
        this.popupService.closePopup(); 
        window.location.reload();
        // Close the popup after successful upload
      },
      error => {
        console.error('Error uploading files', error);
      }
    );
  }
  

  triggerFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  openChoosePopup(): void {
    this.popupService.openChoosePopup();
  }

  onUploadExcel(): void {
    this.popupService.openUploadPopup(); // Opens the file upload popup
  }

  onImportFromDatabase(): void {
    // Handle database import logic here
    this.popupService.closePopup(); // Close the popup after selecting import
  }

  closePopup(): void {
    this.popupService.closePopup();
  }
}
