
import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Card, Row, Col, Space, Select, Input, DatePicker, Button, Spin, Table, message
} from 'antd';
import {
  getDimensions, getMetrics, queryReport, aggregateReport, exportReport,
  ReportQueryRequest, AdReportData
} from '../api';
import { debounce } from '../utils/debounce';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/lib/date-picker';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import axios from 'axios'; // Ensure axios is imported for error checking

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

interface SummaryMetrics {
  totalRequests: number;
  totalImpressions: number;
  totalClicks: number;
  totalPayout: number;
  averageEcpm: number;
}

// Define constants for page sizes
const DEFAULT_PAGE_SIZE = 100; 
const SEARCH_PAGE_SIZE = 10000;

export default function DashboardPage() {
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [tableData, setTableData] = useState<AdReportData[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0); 
  const [loading, setLoading] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<SummaryMetrics>({
    totalRequests: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalPayout: 0,
    averageEcpm: 0,
  });

  const [queryParams, setQueryParams] = useState<ReportQueryRequest>({
    groupByDimensions: [],
    metrics: [],
    page: 1,
    size: DEFAULT_PAGE_SIZE, // Initial default page size
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    mobileAppNames: [],
    inventoryFormatNames: [],
    operatingSystemVersionNames: [],
    searchQuery: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  });

  // --- Helper functions for available dimensions/metrics (moved to top) ---
  // These are static lists for frontend UI, wrapped in useCallback for memoization
  const getAvailableDimensions = useCallback(() => {
    return ["mobileAppResolvedId", "mobileAppName", "domain", "adUnitName", "adUnitId", "inventoryFormatName", "operatingSystemVersionName", "date"];
  }, []);

  const getAvailableMetrics = useCallback(() => {
    return ["adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate", "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks", "adExchangeLineItemLevelCtr", "averageEcpm", "payout"];
  }, []);


  // --- API Calls for Dimensions and Metrics (run once) ---
  useEffect(() => {
    getDimensions().then(res => setAvailableDimensions(res || [])).catch(err => console.error("Error fetching dimensions:", err));
    getMetrics().then(res => setAvailableMetrics(res || [])).catch(err => console.error("Error fetching metrics:", err));
  }, []);
  // Empty dependency array means this runs once on mount

  // --- Data Fetching Logic (debounced and memoized) ---
  // This effect will re-run whenever queryParams changes
  const fetchReportData = useCallback(debounce(async (params: ReportQueryRequest) => {
    setLoading(true);
    try {
      // Adjust the 'size' parameter based on whether a search query is active
      const request: ReportQueryRequest = {
        ...params,
        size: params.searchQuery ? SEARCH_PAGE_SIZE : params.size,
      };
      const response = await queryReport(request);
      setTableData(response.content || []);
      setTotalRecords(response.totalElements || 0); 
    } catch (error) {
      console.error("Error fetching report data:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend Error Response (Report Data):", error.response.data);
      }
      setTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, 500), []); 
  // Debounce to prevent excessive API calls on rapid filter changes

  const fetchSummaryData = useCallback(debounce(async (params: ReportQueryRequest) => {
    try {
      // For summary, we always want aggregate based on all available metrics
      const request: ReportQueryRequest = {
        startDate: params.startDate,
        endDate: params.endDate,
        mobileAppNames: params.mobileAppNames,
        inventoryFormatNames: params.inventoryFormatNames,
        operatingSystemVersionNames: params.operatingSystemVersionNames,
        searchQuery: params.searchQuery,
        metrics: getAvailableMetrics(),
        groupByDimensions: [], 
        page: 1,
        size: 1 
        // For aggregate, we only need 1 result (the overall aggregate)
      };
      const response = await aggregateReport(request);
      if (response && response.length > 0) {
        const aggregated = response[0];
        setSummaryData({
          totalRequests: aggregated.adExchangeTotalRequests || 0,
          totalImpressions: aggregated.adExchangeLineItemLevelImpressions || 0,
          totalClicks: aggregated.adExchangeLineItemLevelClicks || 0,
          totalPayout: aggregated.payout || 0,
          averageEcpm: aggregated.averageEcpm || 0,
        });
      } else {
        setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
      }
    } catch (error) {
      console.error("Error fetching summary data:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend Error Response (Summary Data):", error.response.data);
      }
      setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
    }
  }, 500), [getAvailableMetrics]); 
  // Dependency on getAvailableMetrics is now correctly defined


  // This useEffect triggers the data fetching whenever queryParams changes
  useEffect(() => {
    fetchReportData(queryParams);
    fetchSummaryData(queryParams);
  }, [queryParams, fetchReportData, fetchSummaryData]);
  // CRITICAL: queryParams is the dependency

  // --- Handlers for Filters and Table ---
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setQueryParams(prev => ({
      ...prev,
      startDate: dateStrings[0],
      endDate: dateStrings[1],
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleMultiSelectChange = (field: keyof ReportQueryRequest) => (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, 
    }));
  };

  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      searchQuery: value || undefined, 
      // Set to undefined if empty string
      page: 1, /
      / Reset to first page on filter change
      size: value ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE, 
      // Adjust size based on search query presence
    }));
  };

  const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, 
    }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: any, 
    // Ant Design filters (not used in your current backend query logic directly)
    sorter: any 
    // Ant Design sorter
  ) => {
    const newPage = Math.max(1, pagination.current || 1);
    // Allow page size up to SEARCH_PAGE_SIZE if search is active, otherwise cap at DEFAULT_PAGE_SIZE
    const maxAllowedSize = queryParams.searchQuery ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE;
    const newSize = Math.min(Math.max(1, pagination.pageSize || 10), maxAllowedSize);

    let newSortBy: string | undefined = undefined;
    let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;

    if (sorter && sorter.field) {
      newSortBy = sorter.field.toString();
      newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setQueryParams(prev => ({
      ...prev,
      page: newPage,
      size: newSize,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    }));
  };

  const handleExportCsv = () => {
    const exportRequest: ReportQueryRequest = {
      ...queryParams,
      // For export, we want all records matching the current filters, so use totalRecords
      size: totalRecords > 0 ? totalRecords : 1, 
      // Ensure size is at least 1 if totalRecords is 0
      page: 1,
      // Always export from the first page
    };
    exportReport(exportRequest);
  };

  // --- Dynamic Column Generation for Table ---
  const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
    if (data.length === 0) {
      // If no data, return default columns or empty array
      // For consistency, let's return columns based on selected dimensions/metrics if available,
      // otherwise all available.
      let keys: string[] = [];
      if (queryParams.groupByDimensions && queryParams.groupByDimensions.length > 0) {
        keys.push(...queryParams.groupByDimensions);
      } else {
        keys.push(...getAvailableDimensions());
      }
      if (queryParams.metrics && queryParams.metrics.length > 0) {
        keys.push(...queryParams.metrics);
      } else {
        keys.push(...getAvailableMetrics());
      }
      keys = Array.from(new Set(keys)); // Remove duplicates

      const emptyColumns = keys.filter(key => key !== 'id').map(key => ({
        title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
        dataIndex: key,
        key: key,
        sorter: true,
      }));
      return [{ title: 'S.No.', key: 'serialNumber', width: 70, fixed: 'left', render: (text, record, index) => index + 1 }, ...emptyColumns];
    }

    // Use the keys from the first data object to generate columns
    const allKeys = Object.keys(data[0]);
    const displayKeys = allKeys.filter(key => key !== 'id');

    const baseColumns = displayKeys.map(key => ({
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
      dataIndex: key,
      key: key,
      sorter: true,
      render: (text: any) => {
        if (key === 'date') {
          return dayjs(text).format('YYYY-MM-DD');
        }
        if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
          return text.toFixed(2);
        }
        return text;
      }
    }));

    const serialNumberColumn: ColumnsType<AdReportData>[0] = {
      title: 'S.No.',
      key: 'serialNumber',
      width: 70,
      fixed: 'left',
      render: (text, record, index) => (queryParams.page - 1) * queryParams.size + index + 1,
    };

    return [serialNumberColumn, ...baseColumns];
  };

  // Memoize columns to prevent unnecessary re-renders
  const columns = React.useMemo(() => generateColumns(tableData), [tableData, queryParams.page, queryParams.size, availableDimensions, availableMetrics]);

  // Determine pageSizeOptions dynamically
  const getPageSizeOptions = () => {
    if (queryParams.searchQuery) {
      return ['10', '20', '50', '100', '1000', '10000']; 
      // Include 10000 for search
    } else {
      return ['10', '20', '50', '100']; 
      // Default options
    }
  };

  // Determine the total for pagination dynamically
  const getPaginationTotal = () => {
    return totalRecords; 
    // Showing actual total from backend
  };


  // --- Render ---
  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Ad Reporting Dashboard</Title>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Requests" bordered={false}>
            <Text strong>{summaryData.totalRequests.toLocaleString()}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Impressions" bordered={false}>
            <Text strong>{summaryData.totalImpressions.toLocaleString()}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Clicks" bordered={false}>
            <Text strong>{summaryData.totalClicks.toLocaleString()}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total Payout" bordered={false}>
            <Text strong>${summaryData.totalPayout.toFixed(2)}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Average eCPM" bordered={false}>
            <Text strong>${summaryData.averageEcpm.toFixed(2)}</Text>
          </Card>
        </Col>
      </Row>

      {/* Advanced Reporting Interface */}
      <Card title="Report Filters & Builder" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Date Range Filter */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Date Range:</Text></Col>
            <Col span={18}>
              <RangePicker
                value={[queryParams.startDate ? dayjs(queryParams.startDate) : null, queryParams.endDate ? dayjs(queryParams.endDate) : null]}
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Col>
          </Row>

          {/* Dynamic Report Builder: Group By Dimensions */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Group By:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Select dimensions to group by"
                value={queryParams.groupByDimensions}
                onChange={handleDynamicSelectChange('groupByDimensions')}
                style={{ width: '100%' }}
                allowClear
              >
                {availableDimensions.map(dim => (
                  <Option key={dim} value={dim}>{dim.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Option>
                ))}
              </Select>
            </Col>
          </Row>

          {/* Dynamic Report Builder: Metrics */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Metrics:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Select metrics to display"
                value={queryParams.metrics}
                onChange={handleDynamicSelectChange('metrics')}
                style={{ width: '100%' }}
                allowClear
              >
                {availableMetrics.map(metric => (
                  <Option key={metric} value={metric}>{metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Option>
                ))}
              </Select>
            </Col>
          </Row>

          {/* Multi-Select Filters */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>App Names:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Filter by app names"
                value={queryParams.mobileAppNames}
                onChange={handleMultiSelectChange('mobileAppNames')}
                style={{ width: '100%' }}
                allowClear
              >
                {/* These options should ideally come from backend distinct values */}
                <Option value="Gangs Town Story: Grand Crime">Gangs Town Story: Grand Crime</Option>
                <Option value="Funny Supermarket game">Funny Supermarket game</Option>
                {/* ... add more options based on your data */}
              </Select>
            </Col>
          </Row>
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Inventory Formats:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Filter by inventory formats"
                value={queryParams.inventoryFormatNames}
                onChange={handleMultiSelectChange('inventoryFormatNames')}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="Banner">Banner</Option>
                <Option value="Rewarded">Rewarded</Option>
                {/* ... add more options */}
              </Select>
            </Col>
          </Row>
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>OS Versions:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Filter by OS versions"
                value={queryParams.operatingSystemVersionNames}
                onChange={handleMultiSelectChange('operatingSystemVersionNames')}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="iOS 15.3">iOS 15.3</Option>
                <Option value="iOS 16.7">iOS 16.7</Option>
              </Select>
            </Col>
          </Row>

          {/* Real-time Search */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Search:</Text></Col>
            <Col span={18}>
              <Search
                placeholder="Search across fields"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)} // Live search as user types
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
          </Row>

          {/* Action Buttons */}
          <Row gutter={16} style={{ marginTop: '20px' }}>
            <Col span={12}>
              <Button type="primary" onClick={handleExportCsv} block>
                Export Current Report CSV
              </Button>
            </Col>
            {/* Save/Load Reports - Placeholder */}
            <Col span={12}>
              <Button onClick={() => message.info('Save/Load Report functionality coming soon!')} block>
                Save/Load Report (Future)
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Data Table */}
      <Card title="Report Data" style={{ marginBottom: '20px' }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={tableData} // This should now correctly reflect filtered data
            rowKey="id"
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.size,
              total: getPaginationTotal(), // Use dynamic total
              showSizeChanger: true,
              pageSizeOptions: getPageSizeOptions(), // Use dynamic page size options
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            bordered
          />
        </Spin>
      </Card>
    </div>
  );
}
