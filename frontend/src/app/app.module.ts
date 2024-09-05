import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ResizableModule } from 'angular-resizable-element';
import { MatInputModule } from '@angular/material/input';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { AppComponent } from './app.component';
import { GraphComponent } from './graph/graph.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ChronologyFilterComponent } from './filter/chronology-filter/chronology-filter.component';
import { FileUploadComponent } from './data/file-upload/file-upload.component';
import { PopupService } from './popup.service';
import { GraphService } from './graph.service';
import { SegmentsFilterComponent } from './filter/segments-filter/segments-filter.component';
import { FiltersSelectionComponent } from './filter/filters-selection/filters-selection.component';


@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    ChronologyFilterComponent,
    FileUploadComponent,
    SegmentsFilterComponent,
    FiltersSelectionComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSliderModule,
    FormsModule,
    MatCheckboxModule,
    MatMenuModule,
    HttpClientModule,
    MatDialogModule,
    DragDropModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    ResizableModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [
    provideAnimationsAsync(),PopupService,GraphService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
