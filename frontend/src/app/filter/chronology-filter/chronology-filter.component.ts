import { Component, OnInit } from '@angular/core';
import { GraphService } from '../../graph.service';
import { PopupService } from '../../popup.service';
import { GraphDataService } from '../../graph-data.service'; 


@Component({
  selector: 'app-chronology-filter',
  templateUrl: './chronology-filter.component.html',
  styleUrls: ['./chronology-filter.component.css']
})
export class ChronologyFilterComponent implements OnInit {
  availableYears: number[] = [];
  months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];
  startMonth: number = 1; 
  endMonth: number = 12; 
  startDate: string = '';
  endDate: string = '';
  selectedYear: number | null = null;
  selectedGraphId: number | null = null; 
  graphs: string[] = []; 
  showGraphSection: boolean = false; 
  noDataMessage: string = '';

  constructor(private graphService: GraphService, private popupService: PopupService,private graphDataService: GraphDataService 
  ) {}

  ngOnInit(): void {
    this.loadAvailableYears();
  }

  loadAvailableYears(): void {
    this.graphService.getAvailableYears().subscribe(response => {
      this.availableYears = response.years;
    });
  }

  onYearChange(event: any): void {
    this.selectedYear = +event.target.value;
    this.updateDateRange();
  }

  onStartMonthChange(event: any): void {
    this.startMonth = +event.target.value;
    this.updateDateRange();
  }

  onEndMonthChange(event: any): void {
    this.endMonth = +event.target.value;
    this.updateDateRange();
  }

  updateDateRange(): void {
    if (this.selectedYear !== null) {
      this.startDate = `${this.selectedYear}-${this.startMonth.toString().padStart(2, '0')}-01`;
      const endMonth = this.endMonth === 12 ? this.endMonth : this.endMonth + 1; 
      this.endDate = `${this.selectedYear}-${endMonth.toString().padStart(2, '0')}-01`; 
    }
  }

  applyFilter(): void {
    if (this.selectedYear && this.startDate && this.endDate) {
      const filterParams = {
        years: [this.selectedYear],
        months: [this.startMonth, this.endMonth],
        start_month: this.startMonth,
        end_month: this.endMonth
      };
  
      this.graphService.filterGraphByChronology(filterParams).subscribe(
        data => {
          console.log('Filtered data:', data);
  
          if (data?.graphs) {
            const graphs = data.graphs.map((graph: any) =>
              'data:image/png;base64,' + graph.image_base64
            );
  
            console.log('Graphs with base64:', graphs);
  
            if (graphs.length > 0) {
              this.graphDataService.updateGraphs(graphs);
  
              this.showGraphSection = true;
              this.noDataMessage = '';
            } else {
              console.warn('No graphs data found in graphs array.');
              this.showGraphSection = false;
              this.noDataMessage = 'No graphs data available.';
            }
          } else {
            console.warn('No graphs data found in response.');
            this.showGraphSection = false;
            this.noDataMessage = 'No graphs data available.';
          }
        },
        error => {
          console.error('Error fetching filtered data:', error);
          this.showGraphSection = false;
          this.noDataMessage = 'Error fetching graphs data.';
        }
      );
    } else {
      console.log('Please complete all fields.');
      this.noDataMessage = 'Please complete all fields before applying the filter.';
    }
  }
  
  
  onGraphSelect(event: any): void {
    this.selectedGraphId = +event.target.value;
  }
}
