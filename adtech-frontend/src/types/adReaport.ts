// export interface AdReportData {
//   id: number;
//   mobile_app_resolved_id: string;
//   mobile_app_name: string;
//   domain: string;
//   ad_unit_name: string;
//   ad_unit_id: string;
//   inventory_format_name: string;
//   operating_system_version_name: string;
//   date: string;
//   ad_exchange_total_requests: number;
//   ad_exchange_responses_served: number;
//   ad_exchange_match_rate: number;
//   ad_exchange_line_item_level_impressions: number;
//   ad_exchange_line_item_level_clicks: number;
//   ad_exchange_line_item_level_ctr: number;
//   average_ecpm: number;
//   payout: number;
// }
export interface AdReportData {
  id: number;
  mobileAppResolvedId: string;
  mobileAppName: string;
  domain: string;
  adUnitName: string;
  adUnitId: string;
  inventoryFormatName: string;
  operatingSystemVersionName: string;
  date: string; // Using string to match backend's YYYY-MM-DD format
  adExchangeTotalRequests: number;
  adExchangeResponsesServed: number;
  adExchangeMatchRate: number;
  adExchangeLineItemLevelImpressions: number;
  adExchangeLineItemLevelClicks: number;
  adExchangeLineItemLevelCtr: number;
  averageEcpm: number;
  payout: number;
}

/**
 * Interface representing the request payload for querying reports
 * sent from the frontend to the backend.
 */
export interface ReportQueryRequest {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  mobileAppNames?: string[];
  inventoryFormatNames?: string[];
  operatingSystemVersionNames?: string[];
  searchQuery?: string;
  groupByDimensions?: string[];
  metrics?: string[];
  page: number; // Frontend typically sends 1-indexed page, backend expects 0-indexed
  size: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
