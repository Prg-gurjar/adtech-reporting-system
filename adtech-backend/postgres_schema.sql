--
-- Table structure for table "ad_report_data"
--

DROP TABLE IF EXISTS "ad_report_data";

CREATE TABLE "ad_report_data" (
  "id" BIGSERIAL NOT NULL,
  "mobile_app_resolved_id" varchar(255) NOT NULL,
  "mobile_app_name" varchar(255) DEFAULT NULL,
  "domain" varchar(255) DEFAULT NULL,
  "ad_unit_name" varchar(255) DEFAULT NULL,
  "ad_unit_id" varchar(255) DEFAULT NULL,
  "inventory_format_name" varchar(255) DEFAULT NULL,
  "operating_system_version_name" varchar(255) DEFAULT NULL,
  "date" date NOT NULL,
  "ad_exchange_total_requests" bigint DEFAULT NULL,
  "ad_exchange_responses_served" bigint DEFAULT NULL,
  "ad_exchange_match_rate" double precision DEFAULT NULL, -- Changed DOUBLE to DOUBLE PRECISION
  "ad_exchange_line_item_level_impressions" bigint DEFAULT NULL,
  "ad_exchange_line_item_level_clicks" bigint DEFAULT NULL,
  "ad_exchange_line_item_level_ctr" double precision DEFAULT NULL, -- Changed DOUBLE to DOUBLE PRECISION
  "average_ecpm" double precision DEFAULT NULL, -- Changed DOUBLE to DOUBLE PRECISION
  "payout" double precision DEFAULT NULL, -- Changed DOUBLE to DOUBLE PRECISION
  PRIMARY KEY ("id"),
  KEY "idx_date" ("date"),
  KEY "idx_mobile_app_name" ("mobile_app_name"),
  KEY "idx_inventory_format" ("inventory_format_name"),
  KEY "idx_os_version" ("operating_system_version_name"),
  KEY "idx_total_requests" ("ad_exchange_total_requests"),
  KEY "idx_impressions" ("ad_exchange_line_item_level_impressions"),
  KEY "idx_clicks" ("ad_exchange_line_item_level_clicks"),
  KEY "idx_payout" ("payout"),
  KEY "idx_avg_ecpm" ("average_ecpm"),
  KEY "idx_date_app_format" ("date","mobile_app_name","inventory_format_name")
);