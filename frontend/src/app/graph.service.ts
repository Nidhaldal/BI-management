import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FilterParams } from './interfaces';

interface SegmentColumnsResponse {
  columns: string[];
}

interface AvailableYearsResponse {
  years: number[];
  available_years: number[];
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private apiUrlExecute = 'http://localhost:8000/graph/execute/';
  private apiUrlFilter = 'http://localhost:8000/graph/filter/';
  private apiUrlUniqueValues = 'http://localhost:8000/graph/unique-values/';
  private apiUrlSegments = 'http://localhost:8000/graph/segments/';
  private apiUrlAvailableYears = 'http://localhost:8000/graph/available-years/';
  private apiUrlFilterChronology = 'http://localhost:8000/graph/filter-chronology/';
  private apiUrlUploadFiles = 'http://localhost:8000/graph/upload/';
  private apiUrlAvailableFiles = 'http://localhost:8000/graph/available-files/';
  private apiUrlGetFileById = 'http://localhost:8000/graph/file/';
  private apiUrlGetAllGraphs = 'http://localhost:8000/graph/get-all-graphs/';

  constructor(private http: HttpClient) {}

  executeCode(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrlExecute, formData).pipe(
      catchError(error => {
        console.error('Error during executeCode:', error);
        return throwError(error);
      })
    );
  }

  applyFilters(file: File, code: string, filterParams: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file); 
    formData.append('code', code); 
    
    formData.append('file_ids', JSON.stringify(filterParams.file_ids || []));
    formData.append('column', filterParams.column || '');
    formData.append('filters', JSON.stringify(filterParams.filters || {}));
    
    return this.http.post<any>(this.apiUrlFilter, formData, { responseType:  'json' }).pipe(
      catchError(error => {
        console.error('Error applying filters:', error);
        return throwError(error);
      })
    );
  }
  
  
  
  filterGraphByChronology(filterParams: FilterParams): Observable<any> {
    const formData = new FormData();
    
    if (filterParams.years) {
      formData.append('years', JSON.stringify(filterParams.years));
    }
    if (filterParams.months) {
      formData.append('months', JSON.stringify(filterParams.months));
    }
    if (filterParams.start_month !== undefined) {
      formData.append('start_month', filterParams.start_month.toString());
    }
    if (filterParams.end_month !== undefined) {
      formData.append('end_month', filterParams.end_month.toString());
    }
  
    return this.http.post<any>(this.apiUrlFilterChronology, formData).pipe(
      catchError(error => {
        console.error('Error filtering graph by chronology:', error);
        return throwError(error);
      })
    );
  }
  

  getUniqueValues(fileId: number, column: string): Observable<any> {
    const formData = new FormData();
    formData.append('file_ids[]', fileId.toString());
    formData.append('column', column);

    return this.http.post<any>(this.apiUrlUniqueValues, formData).pipe(
      tap(response => console.log('Response from getUniqueValues:', response)),
      catchError(error => {
        console.error('Error fetching unique values:', error);
        return throwError(error);
      })
    );
  }

  getFileById(id: number): Observable<Blob> {
    const url = `${this.apiUrlGetFileById}${id}/`;

    return this.http.get<Blob>(url, { responseType: 'blob' as 'json' }).pipe(
      catchError(error => {
        console.error('Error fetching file by ID:', error);
        return throwError(error);
      })
    );
  }

  getAvailableSegmentColumns(fileId: number): Observable<SegmentColumnsResponse> {
    const url = `${this.apiUrlSegments}?file_id=${fileId}`;

    return this.http.get<SegmentColumnsResponse>(url).pipe(
      tap(response => console.log('Available segment columns response:', response)),
      catchError(error => {
        console.error('Error fetching segment columns:', error);
        return throwError(error);
      })
    );
  }

  getAvailableYears(): Observable<AvailableYearsResponse> {
    return this.http.get<AvailableYearsResponse>(this.apiUrlAvailableYears).pipe(
      tap(response => console.log('Response from backend:', response)),
      catchError(error => {
        console.error('Error fetching available years from backend:', error);
        return throwError(error);
      })
    );
  }

  getAvailableFiles(): Observable<{ files: { id: number; name: string }[] }> {
    return this.http.get<{ files: { id: number; name: string }[] }>(this.apiUrlAvailableFiles).pipe(
      catchError(error => {
        console.error('Error fetching available files:', error);
        return throwError(error);
      })
    );
  }

  uploadFiles(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.http.post<any>(this.apiUrlUploadFiles, formData).pipe(
      catchError(error => {
        console.error('Error uploading files:', error);
        return throwError(error);
      })
    );
  }

  getAllGraphs(): Observable<any> {
    return this.http.get<any>(this.apiUrlGetAllGraphs).pipe(
      catchError(error => {
        console.error('Error fetching all graphs:', error);
        return throwError(error);
      })
    );
  }
}
