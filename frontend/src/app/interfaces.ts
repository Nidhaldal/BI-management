export interface FilterParams {
  file_ids?: number[];      
  code?: string;             
  filters?: { [key: string]: string[] }; 
  sort_by?: string;         
  sort_order?: 'asc' | 'desc'; 
  years?: number[];         
  months?: number[];        
  column?: string;           
  start_month?: number;      
  end_month?: number;       
}


export interface AvailableYearsResponse {
  years: number[];
}