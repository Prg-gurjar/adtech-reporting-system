// import axios from 'axios';
// import { message } from 'antd';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8091/api'|| 'https://adtech-reporting-system-n1w9.vercel.app',
//   timeout: 60000, // 60 seconds timeout
// });

// // --- API Interfaces ---
// export interface ReportQueryRequest {
//   startDate?: string;
//   endDate?: string;
//   mobileAppNames?: string[];
//   inventoryFormatNames?: string[];
//   operatingSystemVersionNames?: string[];
//   searchQuery?: string;
//   groupByDimensions?: string[];
//   metrics?: string[];
//   page: number;
//   size: number;
//   sortBy?: string;
//   sortOrder?: 'ASC' | 'DESC';
// }

// export interface AdReportData {
//   id: number;
//   mobileAppResolvedId: string;
//   mobileAppName: string;
//   domain: string;
//   adUnitName: string;
//   adUnitId: string;
//   inventoryFormatName: string;
//   operatingSystemVersionName: string;
//   date: string;
//   adExchangeTotalRequests: number;
//   adExchangeResponsesServed: number;
//   adExchangeMatchRate: number;
//   adExchangeLineItemLevelImpressions: number;
//   adExchangeLineItemLevelClicks: number;
//   adExchangeLineItemLevelCtr: number;
//   averageEcpm: number;
//   payout: number;
// }

// // NOTE: It's good practice to define a more specific type for aggregated data
// // as it may have different fields or formats than the raw data.
// // export interface AggregatedReportData {
// //   dimension1: string;
// //   dimension2: string;
// //   sumOfMetric1: number;
// //   ...
// // }

// // --- API Functions ---
// export const getDimensions = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/dimensions');
//   return response.data;
// };

// export const getMetrics = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/metrics');
//   return response.data;
// };

// export const queryReport = async (
//   query: ReportQueryRequest
// ): Promise<{ content: AdReportData[]; totalElements: number }> => {
//   const response = await api.post<{ content: AdReportData[]; totalElements: number }>('/reports/query', query);
//   return response.data;
// };

// export const aggregateReport = async (query: ReportQueryRequest): Promise<any[]> => {
//   const response = await api.post<any[]>('/reports/aggregate', query);
//   return response.data;
// };

// export const exportReport = async (query: ReportQueryRequest): Promise<void> => {
//   try {
//     const response = await api.post('/reports/export', query, {
//       responseType: 'blob',
//     });

//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', 'ad_report.csv');
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
//     message.success('Report exported successfully!');
//   } catch (error) {
//     console.error('Error exporting report:', error);
//     // NOTE: When responseType is 'blob', error.response?.data is a blob,
//     // so we can't read `data.message`. A generic message is safer.
//     message.error('Failed to export report. Please try again or contact support.');
//     throw error;
//   }
// };

// // Add a single, comprehensive response interceptor for global error handling
// // NOTE: I've removed the duplicate interceptor from your original code.
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (axios.isAxiosError(error)) {
//       if (error.response) {
//         // The request was made and the server responded with a status code
//         // that falls out of the range of 2xx
//         console.error('API Error Response:', error.response.data);
//         console.error('API Error Status:', error.response.status);
//         throw new Error(error.response.data.message || `Server Error: ${error.response.status}`);
//       } else if (error.request) {
//         // The request was made but no response was received
//         console.error('API Error Request:', error.request);
//         throw new Error('No response from server. Please check your network connection.');
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error('API Error Message:', error.message);
//         throw new Error(`Request setup error: ${error.message}`);
//       }
//     } else {
//       // Non-axios error
//       console.error('API Error (Non-Axios):', error);
//       throw new Error(`An unexpected error occurred: ${error.message}`);
//     }
//   }
// );


// // --- CSV Upload ---
// export const uploadCsvData = async (file: File): Promise<string> => {
//   const formData: FormData = new FormData();
//   formData.append('file', file);

//   try {
//     const response = await api.post<string>('/data/import', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error in uploadCsvData:', error);
//     throw error;
//   }
// };

// // NEW API FUNCTIONS to fetch distinct values for filters
// export const getDistinctMobileAppNames = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/distinct-mobile-app-names');
//   return response.data;
// };

// export const getDistinctInventoryFormatNames = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/distinct-inventory-format-names');
//   return response.data;
// };

// export const getDistinctOperatingSystemVersionNames = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/distinct-operating-system-version-names');
//   return response.data;
// };
// import axios from 'axios';
// import { message } from 'antd';

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8091/api',
//   timeout: 60000, // 60 seconds timeout
// });

// // --- API Interfaces ---
// export interface ReportQueryRequest {
//   startDate?: string;
//   endDate?: string;
//   mobileAppNames?: string[];
//   inventoryFormatNames?: string[];
//   operatingSystemVersionNames?: string[];
//   searchQuery?: string;
//   groupByDimensions?: string[];
//   metrics?: string[];
//   page: number;
//   size: number;
//   sortBy?: string;
//   sortOrder?: 'ASC' | 'DESC';
// }

// export interface AdReportData {
//   id: number;
//   mobileAppResolvedId: string;
//   mobileAppName: string;
//   domain: string;
//   adUnitName: string;
//   adUnitId: string;
//   inventoryFormatName: string;
//   operatingSystemVersionName: string;
//   date: string;
//   adExchangeTotalRequests: number;
//   adExchangeResponsesServed: number;
//   adExchangeMatchRate: number;
//   adExchangeLineItemLevelImpressions: number;
//   adExchangeLineItemLevelClicks: number;
//   adExchangeLineItemLevelCtr: number;
//   averageEcpm: number;
//   payout: number;
// }

// // NOTE: It's good practice to define a more specific type for aggregated data
// // as it may have different fields or formats than the raw data.
// // export interface AggregatedReportData {
// //   dimension1: string;
// //   dimension2: string;
// //   sumOfMetric1: number;
// //   ...
// // }

// // --- API Functions ---
// export const getDimensions = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/dimensions');
//   return response.data;
// };

// export const getMetrics = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/metrics');
//   return response.data;
// };

// export const queryReport = async (
//   query: ReportQueryRequest
// ): Promise<{ content: AdReportData[]; totalElements: number }> => {
//   const response = await api.post<{ content: AdReportData[]; totalElements: number }>('/reports/query', query);
//   return response.data;
// };

// export const aggregateReport = async (query: ReportQueryRequest): Promise<any[]> => {
//   const response = await api.post<any[]>('/reports/aggregate', query);
//   return response.data;
// };

// export const exportReport = async (query: ReportQueryRequest): Promise<void> => {
//   try {
//     const response = await api.post('/reports/export', query, {
//       responseType: 'blob',
//     });

//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', 'ad_report.csv');
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
//     message.success('Report exported successfully!');
//   } catch (error) {
//     console.error('Error exporting report:', error);
//     // NOTE: When responseType is 'blob', error.response?.data is a blob,
//     // so we can't read `data.message`. A generic message is safer.
//     message.error('Failed to export report. Please try again or contact support.');
//     throw error;
//   }
// };

// // Add a single, comprehensive response interceptor for global error handling
// // NOTE: I've removed the duplicate interceptor from your original code.
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (axios.isAxiosError(error)) {
//       if (error.response) {
//         // The request was made and the server responded with a status code
//         // that falls out of the range of 2xx
//         console.error('API Error Response:', error.response.data);
//         console.error('API Error Status:', error.response.status);
//         throw new Error(error.response.data.message || `Server Error: ${error.response.status}`);
//       } else if (error.request) {
//         // The request was made but no response was received
//         console.error('API Error Request:', error.request);
//         throw new Error('No response from server. Please check your network connection.');
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error('API Error Message:', error.message);
//         throw new Error(`Request setup error: ${error.message}`);
//       }
//     } else {
//       // Non-axios error
//       console.error('API Error (Non-Axios):', error);
//       throw new Error(`An unexpected error occurred: ${error.message}`);
//     }
//   }
// );


// // --- CSV Upload ---
// export const uploadCsvData = async (file: File): Promise<string> => {
//   const formData: FormData = new FormData();
//   formData.append('file', file);

//   try {
//     const response = await api.post<string>('/data/import', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error in uploadCsvData:', error);
//     throw error;
//   }
// };

// // NEW API FUNCTIONS to fetch distinct values for filters
// export const getDistinctMobileAppNames = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/distinct-mobile-app-names');
//   return response.data;
// };

// export const getDistinctInventoryFormatNames = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/distinct-inventory-format-names');
//   return response.data;
// };

// export const getDistinctOperatingSystemVersionNames = async (): Promise<string[]> => {
//   const response = await api.get<string[]>('/reports/distinct-operating-system-version-names');
//   return response.data;
// };

import axios from 'axios';
    import { message } from 'antd';

    // Ensure this baseURL correctly points to your Render backend
    // It should be set as an environment variable on Vercel: REACT_APP_API_URL
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8091/api';

    const api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 60 seconds timeout
    });

    // --- API Interfaces ---
    export interface ReportQueryRequest {
      startDate?: string;
      endDate?: string;
      mobileAppNames?: string[];
      inventoryFormatNames?: string[];
      operatingSystemVersionNames?: string[];
      searchQuery?: string;
      groupByDimensions?: string[];
      metrics?: string[];
      page: number;
      size: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }

    export interface AdReportDto {
      id: number;
      mobileAppName: string;
      inventoryFormatName: string;
      operatingSystemVersionName: string;
      date: string;
      totalRequests: number;
      impressions: number;
      clicks: number;
      payout: number;
      averageEcpm: number;
      matchRate: number;
    }

    // --- API Functions ---
    export const getDimensions = async (): Promise<string[]> => {
      const response = await api.get<string[]>('/reports/dimensions');
      return response.data;
    };

    export const getMetrics = async (): Promise<string[]> => {
      const response = await api.get<string[]>('/reports/metrics');
      return response.data;
    };

    export const queryReport = async (
      query: ReportQueryRequest
    ): Promise<{ content: AdReportDto[]; totalElements: number }> => {
      const response = await api.post<{ content: AdReportDto[]; totalElements: number }>('/reports/query', query);
      return response.data;
    };

    export const aggregateReport = async (query: ReportQueryRequest): Promise<any[]> => {
      const response = await api.post<any[]>('/reports/aggregate', query);
      return response.data;
    };

    export const exportReport = async (query: ReportQueryRequest): Promise<void> => {
      try {
        const response = await api.post('/reports/export', query, {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ad_report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        message.success('Report exported successfully!');
      } catch (error) {
        console.error('Error exporting report:', error);
        message.error('Failed to export report. Please try again or contact support.');
        throw error;
      }
    };

    api.interceptors.response.use(
      response => response,
      error => {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error('API Error Response:', error.response.data);
            console.error('API Error Status:', error.response.status);
            throw new Error(error.response.data.message || `Server Error: ${error.response.status}`);
          } else if (error.request) {
            console.error('API Error Request:', error.request);
            throw new Error('No response from server. Please check your network connection.');
          } else {
            console.error('API Error Message:', error.message);
            throw new Error(`Request setup error: ${error.message}`);
          }
        } else {
          console.error('API Error (Non-Axios):', error);
          throw new Error(`An unexpected error occurred: ${error.message}`);
        }
      }
    );

    // *** THIS IS THE CRITICAL CHANGE ***
    // The endpoint must match your backend's @RequestMapping("/api/reports") + @PostMapping("/upload")
    export const uploadCsvData = async (file: File): Promise<string> => {
      const formData: FormData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.post<string>('/reports/upload', formData, { // Changed from '/data/import'
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        console.error('Error in uploadCsvData:', error);
        throw error;
      }
    };

    export const getDistinctMobileAppNames = async (): Promise<string[]> => {
      const response = await api.get<string[]>('/reports/distinct-mobile-app-names');
      return response.data;
    };

    export const getDistinctInventoryFormatNames = async (): Promise<string[]> => {
      const response = await api.get<string[]>('/reports/distinct-inventory-format-names');
      return response.data;
    };

    export const getDistinctOperatingSystemVersionNames = async (): Promise<string[]> => {
      const response = await api.get<string[]>('/reports/distinct-operating-system-version-names');
      return response.data;
    };
    
