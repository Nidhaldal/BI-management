import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GraphDataService {
  private graphsSource = new BehaviorSubject<string[]>([]);
  currentGraphs = this.graphsSource.asObservable();

  constructor() { }

  updateGraphs(graphs: string[]): void {
    this.graphsSource.next(graphs);
  }
}

