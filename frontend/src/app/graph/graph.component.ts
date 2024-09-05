import { Component, OnInit, ViewChild, ElementRef,HostListener } from '@angular/core';
import { PopupService } from '../popup.service';
import { GraphService } from '../graph.service';
import { FilterParams } from '../interfaces';// Adjust the path accordingly
import { HttpErrorResponse } from '@angular/common/http';
import { GraphDataService } from '../graph-data.service'; // Import the new service

import {CdkDrag} from '@angular/cdk/drag-drop';
import { MatDialog ,MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { ChronologyFilterComponent } from '../filter/chronology-filter/chronology-filter.component';
import { ResizableModule } from 'angular-resizable-element';

export type ResizeAnchorType =
  | 'top'
  | 'left'
  | 'bottom'
  | 'right'

export type ResizeDirectionType =
  | 'x'
  | 'y'
  | 'xy';


interface Segment {
  column: string;
  uniqueValues: any[];
  type: 'date' | 'number' | 'string'; // Type of the values
}
interface GraphResponse {
  results: {
    [fileId: string]: {
      graphs: { image: string }[];
      filtered_data: any[];
    };
  };
}


@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
  selectedFileId: number | null = null;
  selectedFile: File | null = null;
  code: string = '';
  graphs: string[] = [];
  availableYears: number[] = [];  // Add this to your class
  sidebarVisible = false;
  isAscending = true; // Track sorting order
  sortedUniqueValues: { [key: number]: any[] } = {}; // Store sorted values for each panel
  private isResizing = false;
  private startX: number = 0;
  private startY: number = 0;
  private startWidth: number = 0;
  private startHeight: number = 0;
  width = 300;
  height = 200;

  filterParams: FilterParams = {
    code: this.code,
    filters: {},    // Initialize with an empty object
    sort_by: '',    // Default empty string or appropriate default value
    sort_order: 'asc' ,// Default sort order
    file_ids: this.selectedFileId !== null ? [this.selectedFileId] : [],
    column: '', // Default to an empty string
    years: [], // Initialize with an empty array
    months: [], // Initialize with an empty array
    start_month: 1, // Default to January
    end_month:  12,

  };
  
  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;
  private resizingElement: HTMLElement | null = null;

  selectedSegments: Segment[] = []; // Use the Segment interface
  showCodeSection: boolean = false;
  showGraphSection: boolean = false;
  fileOptions: { id: number; name: string }[] = [];
  filtersVisible: boolean = false;
  showSidebar = false;
  sortOrder: 'asc' | 'desc' = 'asc'; // Default sort order

  noDataMessage: string = '';

  @ViewChild('uniqueValuesPanel') uniqueValuesPanel!: ElementRef;
  @ViewChild('chronologyFilterPanel') chronologyFilterPanel!: ElementRef; // Add this for chronology filter

  selectedYear: number | null = null;
  selectedMonthRange: { start: number; end: number } | null = null;
  constructor(private graphService: GraphService, private popupService: PopupService,private dialog: MatDialog,    private graphDataService: GraphDataService,  
  ) {}
  ngOnInit(): void {
    this.fetchFileOptions();
  
    // Subscribe to popup service for unique values updates
    this.popupService.uniqueValues$.subscribe(data => {
      if (data) {
        const segmentType: 'date' | 'number' | 'string' = (data as any).type || 'string';
  
        const existingSegment = this.selectedSegments.find(segment => segment.column === data.column);
        if (existingSegment) {
          existingSegment.uniqueValues = data.uniqueValues;
        } else {
          this.selectedSegments.push({ column: data.column, uniqueValues: data.uniqueValues, type: segmentType });
        }
      }
    });
  
    // Subscribe to popup service for chronology filter updates
    this.popupService.chronologyFilter$.subscribe(data => {
      if (data) {
        this.selectedYear = data.year;
        this.selectedMonthRange = data.monthRange;
        this.applyChronologyFilter();
      }
    });
  
    // Subscribe to GraphDataService for graph updates
    this.graphDataService.currentGraphs.subscribe(graphs => {
      if (graphs.length > 0) {
        this.graphs = graphs;
        this.showGraphSection = true;
        this.noDataMessage = '';
      } else {
        this.graphs = [];
        this.showGraphSection = false;
        this.noDataMessage = 'No graphs data available.';
      }
    });
  }
  
  applyChronologyFilter(): void {
    console.log('Applying chronology filter...');
    
    if (!this.selectedYear || !this.selectedMonthRange) {
      console.warn('Missing data for filtering.');
      this.noDataMessage = 'Please select year and month range.';
      return;
    }

    // Prepare the filter parameters
    const filterParams: FilterParams = {
      years: [this.selectedYear],
      months: [this.selectedMonthRange.start, this.selectedMonthRange.end],
      start_month: this.selectedMonthRange.start,
      end_month: this.selectedMonthRange.end
    };

    // Call the backend service to apply the chronology filter
    this.graphService.filterGraphByChronology(filterParams).subscribe(
      (response: GraphResponse) => {
        console.log('Filter response:', response);
        if (response && response.results) {
          this.graphs = Object.values(response.results).flatMap(result =>
            result.graphs.map(graph => 'data:image/png;base64,' + graph.image)
          );
          this.showGraphSection = true;
          this.noDataMessage = '';
          console.log('Filtered graph data:', response.results);
        } else {
          console.warn('No graph data available after filtering.');
          this.graphs = [];
          this.showGraphSection = false;
          this.noDataMessage = 'No graph data available for the selected criteria.';
        }
      },
      (error) => {
        console.error('Error filtering graph by chronology:', error);
        this.graphs = [];
        this.showGraphSection = false;
        this.noDataMessage = 'An error occurred while fetching graph data.';
      }
    );
  }
  graphFiltered(filteredData: any): void {
    console.log('Applying filtered data to the graph:', filteredData);
    // Update the graph with filtered data
  }
  

  ngAfterViewInit(): void {
    if (this.uniqueValuesPanel) {
      this.makePanelDraggable(this.uniqueValuesPanel.nativeElement);
      this.makePanelResizable(this.uniqueValuesPanel.nativeElement);
    }
  }

  toggleSort(panelIndex: number): void {
    // Toggle sort order
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    // Sort values for the specified panel
    this.sortPanelValues(panelIndex);
  }
  sortPanelValues(panelIndex: number): void {
    const segment = this.selectedSegments[panelIndex];
    if (!segment) return;

    const sortedValues = this.sortValues(segment.uniqueValues, this.sortOrder);
    this.sortedUniqueValues[panelIndex] = sortedValues;
  }
  getSortedUniqueValues(segment: any, panelIndex: number): any[] {
    return this.sortedUniqueValues[panelIndex] || segment.uniqueValues || [];
  }
  private sortValues(values: any[], order: 'asc' | 'desc'): any[] {
    return values.slice().sort((a: any, b: any) => {
      if (typeof a === 'string' && typeof b === 'string') {
        return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      } else if (typeof a === 'number' && typeof b === 'number') {
        return order === 'asc' ? a - b : b - a;
      } else {
        return 0;
      }
    });
  }

    
  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    const target = event.target as HTMLElement;
    this.resizingElement = target.closest('.unique-values-panel') as HTMLElement;
    if (this.resizingElement) {
      this.startX = event.clientX;
      this.startY = event.clientY;
      this.startWidth = this.resizingElement.clientWidth;
      this.startHeight = this.resizingElement.clientHeight;
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isResizing && this.resizingElement) {
      const width = this.startWidth + (event.clientX - this.startX);
      const height = this.startHeight + (event.clientY - this.startY);
      this.resizingElement.style.width = `${width}px`;
      this.resizingElement.style.height = `${height}px`;
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    this.isResizing = false;
    this.resizingElement = null;
  }
onDragEnd(event: any): void {
  this.isDragging = false;
  // Optionally update any state or UI after dragging is complete
}

  
  onDataClick(): void {
    this.popupService.openChoosePopup();
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  onGraphClick(): void {
    this.showCodeSection = true;
    this.popupService.closePopup();
  }

  onFiltersClick(): void {
    this.popupService.openFiltersSelectionPopup();
  }

  onCompile(): void {
    if (!this.selectedFileId || !this.code) {
      alert('Please select a file and enter code to compile.');
      return;
    }

    const formData = new FormData();
    formData.append('file_id', this.selectedFileId.toString());
    formData.append('code', this.code);

    this.graphService.executeCode(formData).subscribe(
      (response) => {
        if (response && response.graph) {
          const graphBase64 = 'data:image/png;base64,' + response.graph;
          this.graphs.push(graphBase64);
          this.showGraphSection = true;
          console.log('Graph data:', response.graph);

        }
      },
      (error) => {
        console.error('Error executing code:', error);
      }
    );
  }

  onValidate(): void {
    this.showCodeSection = false;
    this.showGraphSection = true;
    this.popupService.closePopup();
  }

  fetchFileOptions(): void {
    console.log('Fetching file options...');
    this.graphService.getAvailableFiles().subscribe(
      response => {
        console.log('File options response:', response);
        this.fileOptions = response.files || [];
      },
      error => {
        console.error('Error fetching file options:', error);
      }
    );
  }


  openSegmentsFilterPopup(): void {
    this.popupService.openSegmentsFilter();
  }

  openChronologyFilterPopup(file: File | null): void {
    this.popupService.openChronologyFilter(file); // Pass the file to the service
  }
  onSegmentSelected(segment: any): void {
    if (this.selectedFileId) {
      this.graphService.getUniqueValues(this.selectedFileId, segment).subscribe(
        response => {
          const uniqueValues = response.unique_values || [];
          this.popupService.notifyUniqueValues(segment, uniqueValues);
        },
        error => {
          console.error('Error fetching unique values:', error);
        }
      );
    }
  }
  
  onSegmentDeselected(segment: any): void {
    this.selectedSegments = this.selectedSegments.filter(s => s.column !== segment);
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedFileId = Number(target.value);
    
    // Check if selectedFileId is a valid number and greater than 0
    if (selectedFileId > 0) {
      this.selectedFileId = selectedFileId;
  
      this.graphService.getFileById(selectedFileId).subscribe(
        (fileBlob: Blob) => {
          // Assuming the file is a CSV, but adjust as necessary for other file types
          this.selectedFile = new File([fileBlob], "selected-file.csv", { type: fileBlob.type });
          
          // Optional: Handle any post-file selection logic here
          console.log('File selected:', this.selectedFile);
        },
        (error) => {
          console.error('Error fetching file by ID:', error);
          // Optionally, you can provide feedback to the user about the error
        }
      );
    } else {
      console.warn('Invalid file ID selected:', selectedFileId);
      // Optionally, reset selectedFileId or notify the user
    }
  }
  
  
  

  private makePanelDraggable(panel: HTMLElement): void {
    const header = panel.querySelector('.draggable-header') as HTMLElement;
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;

      const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          panel.style.left = `${e.clientX - offsetX}px`;
          panel.style.top = `${e.clientY - offsetY}px`;
        }
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
  private makePanelResizable(panel: HTMLElement): void {
    const resizeHandle = panel.querySelector('.resize-handle') as HTMLElement;

    resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.isResizing = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startWidth = panel.offsetWidth;
      this.startHeight = panel.offsetHeight;

      const onMouseMove = (e: MouseEvent) => {
        if (this.isResizing) {
          const width = this.startWidth + (e.clientX - this.startX);
          const height = this.startHeight + (e.clientY - this.startY);
          panel.style.width = `${width}px`;
          panel.style.height = `${height}px`;
        }
      };

      const onMouseUp = () => {
        this.isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  applyFilters(filterParams: FilterParams): void {
    if (!this.selectedFile || !this.code) {
        console.error('No file selected or code provided');
        this.noDataMessage = 'Please select a file and enter code to compile.';
        return;
    }

    // Ensure fileIds is an array even if selectedFileId is null
    const fileIds = this.selectedFileId ? [this.selectedFileId] : [];

    // Call the applyFilters method of the graph service
    this.graphService.applyFilters(this.selectedFile, this.code, {
        ...filterParams,
        file_ids: fileIds,
    }).subscribe(
        response => {
            if (response && response.graphs && response.graphs.length > 0) {
                // Map each graph's base64 string to an image source
                this.graphs = response.graphs.map((graph: any) => 
                    'data:image/png;base64,' + graph.image
                );

                this.showGraphSection = true;
                this.noDataMessage = ''; // Clear the no data message
            } else {
                // Clear graphs if no graph data is available
                this.graphs = [];
                this.showGraphSection = false;
                this.noDataMessage = 'No graph data available for the selected criteria.';
            }
        },
        (error: HttpErrorResponse) => {
            console.error('Error applying filters:', error);
            // Clear graphs on error and display an error message
            this.graphs = [];
            this.showGraphSection = false;
            this.noDataMessage = 'An error occurred while fetching graph data.';
        }
    );
}

onUniqueValueClicked(column: string, value: any, event: MouseEvent): void {
  // Find the segment by column name
  const segment = this.selectedSegments.find(seg => seg.column === column);

  if (segment) {
    const isCtrlPressed = event.ctrlKey;
    const isShiftPressed = event.shiftKey;

    // Initialize the uniqueValues list if it doesn't exist
    if (!segment.uniqueValues) {
      segment.uniqueValues = [];
    }

    if (isCtrlPressed || isShiftPressed) {
      // Handle multi-selection with Ctrl or Shift
      if (segment.uniqueValues.includes(value)) {
        // Remove the value if it is already selected
        segment.uniqueValues = segment.uniqueValues.filter(v => v !== value);
      } else {
        // Add the value if it is not already selected
        segment.uniqueValues.push(value);
      }
    } else {
      // Single selection mode: set the clicked value as the only selection
      segment.uniqueValues = [value];
    }

    // Log the updated segment unique values
    console.log(`Segment '${column}' unique values after click:`, segment.uniqueValues);

    // Call the method to apply filters with updated selections
    this.onUniqueValueSelected(column, segment.uniqueValues);
  }
}


onUniqueValueSelected(column: string, selectedValues: any[]): void {
  if (this.selectedFile && this.code) {
    // Construct filter parameters with all segments' selected values
    const filters = this.selectedSegments.reduce((acc, segment) => {
      if (segment.uniqueValues.length > 0) {
        acc[segment.column] = segment.uniqueValues;
      }
      return acc;
    }, {} as { [key: string]: any[] });

    const filterParams: FilterParams = {
      file_ids: this.selectedFileId !== null ? [this.selectedFileId] : [],
      column: column,
      filters: filters
    };

    this.applyFilters(filterParams);
  } else {
    console.error('Missing required parameters.');
    this.graphs = []; // Clear previous data
    this.showGraphSection = false;
    this.noDataMessage = 'Please select a file and enter code to compile.';
  }
}



  
  
  createFormData(): FormData {
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    formData.append('code', this.code);
    return formData;
  }
}
