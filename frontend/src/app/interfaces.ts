export interface FilterParams {
  file_ids?: number[];       // Optional: List of file IDs
  code?: string;             // Optional: Code for generating graphs
  filters?: { [key: string]: string[] }; // Optional: Filters where keys are column names and values are arrays of selected values
  sort_by?: string;          // Optional: Column to sort by
  sort_order?: 'asc' | 'desc'; // Optional: Sorting order
  years?: number[];          // Optional: Array of years for filtering (remove 'year')
  months?: number[];         // Optional: Array of months for filtering
  column?: string;           // Optional: Column name for filtering or processing
  start_month?: number;      // Optional: Start month for range filtering
  end_month?: number;        // Optional: End month for range filtering
}


export interface AvailableYearsResponse {
  years: number[];
}