import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://adtech-backend-api.onrender.com/api',
  // timeout: 60000, // 60 seconds timeout
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
): Promise<{ content: AdReportData[]; totalElements: number }> => {
  const response = await api.post('/reports/query', query);
  return response.data;
};

export const aggregateReport = async (query: ReportQueryRequest): Promise<any[]> => {
  const response = await api.post('/reports/aggregate', query);
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

// --- CSV Upload ---
export const uploadCsvData = async (file: File): Promise<any> => {
  const formData:FormData = new FormData();
  formData.append('file', file);

   try {
    const response = await api.post<string>('/data/import', formData);
    return response.data;
  } catch (error: any) {
    console.error('Error in uploadCsvData:', error);
    throw error;
  }
};

// --- Axios Interceptors ---
api.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error Response:', error.response.data);
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

