export interface AdReportData {
  id: number;
  mobile_app_resolved_id: string;
  mobile_app_name: string;
  domain: string;
  ad_unit_name: string;
  ad_unit_id: string;
  inventory_format_name: string;
  operating_system_version_name: string;
  date: string;
  ad_exchange_total_requests: number;
  ad_exchange_responses_served: number;
  ad_exchange_match_rate: number;
  ad_exchange_line_item_level_impressions: number;
  ad_exchange_line_item_level_clicks: number;
  ad_exchange_line_item_level_ctr: number;
  average_ecpm: number;
  payout: number;
}


