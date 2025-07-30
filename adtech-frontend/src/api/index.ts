import axios from 'axios';
import { message } from 'antd';
import { Layout, Menu } from 'antd'; // Assuming these are used elsewhere in this file or component

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://adtech-backend-api.onrender.com',
  timeout: 60000, // 60 seconds timeout
  // No default 'Content-Type' header here, Axios will set it automatically.
});

// Axios is smart enough to set the Content-Type automatically:
// - If you send a plain JavaScript object, it defaults to 'application/json'.
// - If you send a FormData object, it defaults to 'multipart/form-data'.
// - If you send a URLSearchParams object or a simple string, it defaults to 'application/x-www-form-urlencoded'.

// --- API Functions for Dashboard/Reports ---

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

export interface AdReportData {
  id: number;
  mobileAppResolvedId: string;
  mobileAppName: string;
  domain: string;
  adUnitName: string;
  adUnitId: string;
  inventoryFormatName: string;
  operatingSystemVersionName: string;
  date: string;
  adExchangeTotalRequests: number;
  adExchangeResponsesServed: number;
  adExchangeMatchRate: number;
  adExchangeLineItemLevelImpressions: number;
  adExchangeLineItemLevelClicks: number;
  adExchangeLineItemLevelCtr: number;
  averageEcpm: number;
  payout: number;
}

export const getDimensions = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/reports/dimensions');
  return response.data;
};

export const getMetrics = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/reports/metrics');
  return response.data;
};

export const queryReport = async (query: ReportQueryRequest): Promise<{ content: AdReportData[]; totalElements: number }> => {
  const response = await api.post<{ content: AdReportData[]; totalElements: number }>('/reports/query', query);
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
  } catch (error: any) {
    console.error('Error exporting report:', error);
    message.error(error.response?.data || 'Failed to export report.');
    throw error;
  }
};

// Add a request interceptor to log requests (optional, but good for debugging)
api.interceptors.request.use(
  config => {
    // console.log('Request:', config); // Uncomment for more detailed request logging
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);
      throw new Error(error.response.data.message || `Server Error: ${error.response.status}`);
    } else if (error.request) {
      console.error('API Error Request:', error.request);
      throw new Error('No response from server. Please check your network connection.');
    } else {
      console.error('API Error Message:', error.message);
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
);

// Function to upload CSV data
export const uploadCsvData = async (file: File): Promise<string> => {
  // *** CORRECTED LOGIC HERE ***
  const formData = new FormData(); // 1. Initialize FormData
  formData.append('file', file); // 2. Append the *actual* File object directly

  try {
    // 3. Make a single POST request with the correctly formed FormData
    const response = await api.post<string>('/api/data/import', formData);
    return response.data;
  } catch (error: any) {
    console.error('Error in uploadCsvData:', error);
    throw error;
  }
};
