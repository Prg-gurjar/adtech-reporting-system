// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL,
//   headers: { 'Content-Type': 'application/json' },
// });

// export interface ImportResponse { jobId: string; }
// export interface DimensionList { dimensions: string[]; }
// export interface MetricList { metrics: string[]; }

// // In your api.ts file

// export const uploadCsv = (file: File, setUploadProgress: (progress: number) => void) => {
//   const form = new FormData();
//   form.append('file', file);
//   return api.post<ImportResponse>('/api/data/import', form, {
//     headers: { 'Content-Type': 'multipart/form-data' },
//     onUploadProgress: (e) => {
//       const total = e.total ?? 0;
//       if (total > 0) {
//         const percent = Math.round((e.loaded * 100) / total);
//         setUploadProgress(percent); // Now setUploadProgress is available here
//       }
//     },
//   });
// };

// export const fetchImportStatus = (jobId: string) =>
//   api.get<{ status: string; progress: number }>(`/api/data/import/${jobId}/status`);

// export const getDimensions = () => api.get<DimensionList>('/api/reports/dimensions');
// export const getMetrics = () => api.get<MetricList>('/api/reports/metrics');

// export interface QueryParams {
//   dimensions: string[];
//   metrics: string[];
//   filters: Record<string, any>;
//   page: number;
//   pageSize: number;
//   dateRange:  [string, string];
// }

// export interface QueryResponse<T> {
//   data: T[];
//   total: number;
// }

// export const queryReport = (params: QueryParams) =>
//   api.post<QueryResponse<any>>('/api/reports/query', params);
// function setUploadProgress(percent: number) {
//     throw new Error('Function not implemented.');
// }

// 


// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export interface ImportResponse {
//   message: string;
//   jobId: number;
// }

// export interface ImportStatusResponse {
//   jobId: number;
//   status: string;
// }

// // You might not need DimensionList and MetricList if you're directly using string[]
// // export interface DimensionList {
// //   dimensions: string[];
// // }
// // export interface MetricList {
// //   metrics: string[];
// // }

// export interface ReportQueryRequest {
//   startDate?: string;
//   endDate?: string;
//   mobileAppNames?: string[];
//   inventoryFormatNames?: string[];
//   operatingSystemVersionNames?: string[];
//   searchQuery?: string;
//   groupByDimensions?: string[];
//   metrics?: string[];
//   page?: number;
//   size?: number; // This is what corresponds to backend 'pageSize'
//   sortBy?: string;
//   sortOrder?: 'ASC' | 'DESC';
// }

// export interface QueryResponse<T> {
//   content: T[];
//   totalElements: number;
//   totalPages: number;
//   number: number;
// }
// export interface ImportStatusResponse {
//   jobId: number;
//   status: string;
//   progress?: number; // <--- MAKE SURE THIS IS HERE
// }

// export interface AdReportData {
//   mobileAppResolvedId: string;
//   mobileAppName: string;
//   domain: string;
//   adUnitName: string;
//   adUnitId: string;
//   inventoryFormatName: string;
//   operatingSystemVersionName: string;
//   date: string; // YYYY-MM-DD
//   adExchangeTotalRequests: number;
//   adExchangeResponsesServed: number;
//   adExchangeMatchRate: number;
//   adExchangeLineItemLevelImpressions: number;
//   adExchangeLineItemLevelClicks: number;
//   adExchangeLineItemLevelCtr: number;
//   averageEcpm: number;
//   payout: number;
// }

// export const checkBackend = () => api.post<string>('/api/health/check');

// export const uploadCsv = (
//   file: File,
//   setUploadProgress: (progress: number) => void
// ) => {
//   const form = new FormData();
//   form.append('file', file);
//   return api.post<ImportResponse>('/api/data/import', form, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//     onUploadProgress: (e) => {
//       const total = e.total ?? 0;
//       if (total > 0) {
//         const percent = Math.round((e.loaded * 100) / total);
//         setUploadProgress(percent);
//       }
//     },
//   });
// };

// export const fetchImportStatus = (jobId: number) =>
//   api.get<ImportStatusResponse>(`/api/data/import/status/${jobId}`); // <-- FIXED: Template literal backticks

// export const getDimensions = () =>
//   api.get<string[]>('/api/reports/dimensions');

// export const getMetrics = () =>
//   api.get<string[]>('/api/reports/metrics');

// export const queryReport = (params: ReportQueryRequest) =>
//   api.post<QueryResponse<AdReportData>>('/api/reports/query', params);

// export const aggregateReport = (params: ReportQueryRequest) =>
//   api.post<Array<Record<string, any>>>('/api/reports/aggregate', params);

// export const exportReport = async (params: ReportQueryRequest) => {
//   const response = await api.post('/api/reports/export', params, {
//     responseType: 'blob',
//   });

//   const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
//   const url = window.URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'adtech_report.csv');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// src/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ImportResponse {
  message: string;
  jobId: number;
}

// CORRECT: ImportStatusResponse contains jobId, status, progress
export interface ImportStatusResponse {
  jobId: number;
  status: string;
  progress?: number; // Make sure this is here if your backend sends it
}

// CRITICAL CORRECTION: ReportQueryRequest should NOT have jobId or status
export interface ReportQueryRequest {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  mobileAppNames?: string[];
  inventoryFormatNames?: string[];
  operatingSystemVersionNames?: string[];
  searchQuery?: string;
  groupByDimensions?: string[]; // Use this for grouping, NOT 'dimensions' at the top-level
  metrics?: string[];
  page?: number;
  size?: number; // This is 'pageSize' from frontend, but named 'size' for backend
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface QueryResponse<T> {
  content: T[];      // Backend response data for paginated results
  totalElements: number; // Total elements count
  totalPages: number;
  number: number;    // Current page number (0-indexed or 1-indexed depending on backend)
}

export interface AdReportData {
  mobileAppResolvedId: string;
  mobileAppName: string;
  domain: string;
  adUnitName: string;
  adUnitId: string;
  inventoryFormatName: string;
  operatingSystemVersionName: string;
  date: string; // YYYY-MM-DD
  adExchangeTotalRequests: number;
  adExchangeResponsesServed: number;
  adExchangeMatchRate: number;
  adExchangeLineItemLevelImpressions: number;
  adExchangeLineItemLevelClicks: number;
  adExchangeLineItemLevelCtr: number;
  averageEcpm: number;
  payout: number;
}

export const checkBackend = () => api.post<string>('/api/health/check');

export const uploadCsv = (
  file: File,
  setUploadProgress: (progress: number) => void
) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<ImportResponse>('/api/data/import', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (e) => {
      const total = e.total ?? 0;
      if (total > 0) {
        const percent = Math.round((e.loaded * 100) / total);
        setUploadProgress(percent);
      }
    },
  });
};

export const fetchImportStatus = (jobId: number) =>
  api.get<ImportStatusResponse>(`/api/data/import/status/${jobId}`);

export const getDimensions = () =>
  api.get<string[]>('/api/reports/dimensions');

export const getMetrics = () =>
  api.get<string[]>('/api/reports/metrics');

export const queryReport = (params: ReportQueryRequest) =>
  api.post<QueryResponse<AdReportData>>('/api/reports/query', params);

export const aggregateReport = (params: ReportQueryRequest) =>
  api.post<Array<Record<string, any>>>('/api/reports/aggregate', params);

export const exportReport = async (params: ReportQueryRequest) => {
  const response = await api.post('/api/reports/export', params, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-uri;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'adtech_report.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};