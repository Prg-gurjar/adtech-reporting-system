
import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Button, Space, Select, Input, DatePicker, Spin, Card, Row, Col, message } from 'antd';
import DataTable from '../components/DataTable'; // Ensure this import is correct
import {
  getDimensions, getMetrics, ReportQueryRequest, queryReport, AdReportData, exportReport
} from '../api';
import { debounce } from '../utils/debounce';
import axios from 'axios';
import dayjs from 'dayjs';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { RangePickerProps } from 'antd/lib/date-picker';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Define constants for page sizes
const DEFAULT_PAGE_SIZE = 100; // Default page size when no search is active
const SEARCH_PAGE_SIZE = 10000; // Page size when search is active

export default function ReportBuilderPage() {
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [params, setParams] = useState<ReportQueryRequest>({
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
  const [tableData, setTableData] = useState<AdReportData[]>([]);
  const [total, setTotal] = useState(0); // Actual total from backend
  const [loading, setLoading] = useState<boolean>(false);

  // --- API Calls for Dimensions and Metrics (run once) ---
  useEffect(() => {
    getDimensions()
      .then((r) => setAvailableDimensions(r || []))
      .catch((error) => {
        console.error("Error fetching dimensions:", error);
        setAvailableDimensions([]);
      });
    getMetrics()
      .then((r) => setAvailableMetrics(r || []))
      .catch((error) => {
        console.error("Error fetching metrics:", error);
        setAvailableMetrics([]);
      });
  }, []); // Empty dependency array means this runs once on mount

  // --- Data Fetching Logic (debounced and memoized) ---
  // This effect will re-run whenever params changes
  const fetchData = useCallback(debounce(async (currentParams: ReportQueryRequest) => {
    setLoading(true);
    // Adjust the 'size' parameter based on whether a search query is active
    const apiParams: ReportQueryRequest = {
      ...currentParams,
      page: Math.max(1, currentParams.page || 1),
      size: currentParams.searchQuery ? SEARCH_PAGE_SIZE : currentParams.size, // Use 10000 for search, otherwise current size
      startDate: currentParams.startDate,
      endDate: currentParams.endDate,
    };

    console.log("Sending API request with parameters:", apiParams);
    console.log(`Page: ${apiParams.page}, Size: ${apiParams.size}`);

    try {
      const resp = await queryReport(apiParams);
      setTableData(resp.content || []); // CRITICAL: Update tableData with filtered content
      setTotal(resp.totalElements || 0); // Always store the actual total
    } catch (error) {
      console.error("Error fetching report data:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend Error Response:", error.response.data);
      }
      setTableData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, 500), []); // Debounce to prevent excessive API calls on rapid filter changes

  // This useEffect triggers the data fetching whenever params changes
  useEffect(() => {
    fetchData(params);
  }, [params, fetchData]); // CRITICAL: params is the dependency

  // --- Handlers for Filters and Table ---
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setParams(prev => ({
      ...prev,
      startDate: dateStrings[0],
      endDate: dateStrings[1],
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleMultiSelectChange = (field: keyof ReportQueryRequest) => (values: string[]) => {
    setParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleSearch = (value: string) => {
    setParams(prev => ({
      ...prev,
      searchQuery: value || undefined, // Set to undefined if empty string
      page: 1, // Reset to first page on filter change
      size: value ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE, // Adjust size based on search query presence
    }));
  };

  const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
    setParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: any,
    sorter: any
  ) => {
    const newPage = Math.max(1, pagination.current || 1);
    // Allow page size up to SEARCH_PAGE_SIZE if search is active, otherwise cap at DEFAULT_PAGE_SIZE
    const maxAllowedSize = params.searchQuery ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE;
    const newSize = Math.min(Math.max(1, pagination.pageSize || 10), maxAllowedSize);

    let newSortBy: string | undefined = undefined;
    let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;

    if (sorter && sorter.field) {
      newSortBy = sorter.field.toString();
      newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setParams((oldParams: ReportQueryRequest) => ({
      ...oldParams,
      page: newPage,
      size: newSize,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    }));
  };

  const handleExportCsv = () => {
    const exportRequest: ReportQueryRequest = {
      ...params,
      // For export, we want all records matching the current filters, so use total
      size: total > 0 ? total : 1, // Ensure size is at least 1 if total is 0
      page: 1, // Always export from the first page
    };
    exportReport(exportRequest);
  };

  // --- Dynamic Column Generation for DataTable ---
  const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
    if (data.length === 0) {
      // If no data, return default columns or empty array
      let keys: string[] = [];
      if (params.groupByDimensions && params.groupByDimensions.length > 0) {
        keys.push(...params.groupByDimensions);
      } else {
        keys.push(...getAvailableDimensions());
      }
      if (params.metrics && params.metrics.length > 0) {
        keys.push(...params.metrics);
      } else {
        keys.push(...getAvailableMetrics());
      }
      keys = Array.from(new Set(keys)); // Remove duplicates

      const emptyColumns = keys.filter(key => key !== 'id').map(key => ({
        title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
        dataIndex: key,
        key: key,
      }));
      return [{ title: 'S.No.', key: 'serialNumber', width: 70, fixed: 'left', render: (text, record, index) => index + 1 }, ...emptyColumns];
    }

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
      render: (text, record, index) => (params.page - 1) * params.size + index + 1,
    };

    return [serialNumberColumn, ...baseColumns];
  };

  // Memoize columns to prevent unnecessary re-renders
  const columns = React.useMemo(() => generateColumns(tableData), [tableData, params.page, params.size, availableDimensions, availableMetrics]);

  // Determine pageSizeOptions dynamically
  const getPageSizeOptions = () => {
    if (params.searchQuery) {
      return ['10', '20', '50', '100', '1000', '10000']; // Include 10000 for search
    } else {
      return ['10', '20', '50', '100']; // Default options
    }
  };

  // Determine the total for pagination dynamically
  const getPaginationTotal = () => {
    return total; // Showing actual total from backend
  };

  // Helper to get all available dimensions (static list for frontend UI)
  const getAvailableDimensions = useCallback(() => {
    return ["mobileAppResolvedId", "mobileAppName", "domain", "adUnitName", "adUnitId", "inventoryFormatName", "operatingSystemVersionName", "date"];
  }, []);

  // Helper to get all available metrics (static list for frontend UI)
  const getAvailableMetrics = useCallback(() => {
    return ["adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate", "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks", "adExchangeLineItemLevelCtr", "averageEcpm", "payout"];
  }, []);


  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Advanced Reporting</Title>

      <Card title="Report Filters & Builder" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Date Range Filter */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Date Range:</Text></Col>
            <Col span={18}>
              <RangePicker
                value={[params.startDate ? dayjs(params.startDate) : null, params.endDate ? dayjs(params.endDate) : null]}
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
                value={params.groupByDimensions}
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
                value={params.metrics}
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

          {/* Multi-Select Filters (Example options, fetch from backend for real app) */}
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>App Names:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Filter by app names"
                value={params.mobileAppNames}
                onChange={handleMultiSelectChange('mobileAppNames')}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="Gangs Town Story: Grand Crime">Gangs Town Story: Grand Crime</Option>
                <Option value="Funny Supermarket game">Funny Supermarket game</Option>
              </Select>
            </Col>
          </Row>
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>Inventory Formats:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Filter by inventory formats"
                value={params.inventoryFormatNames}
                onChange={handleMultiSelectChange('inventoryFormatNames')}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="Banner">Banner</Option>
                <Option value="Rewarded">Rewarded</Option>
              </Select>
            </Col>
          </Row>
          <Row gutter={16} align="middle">
            <Col span={6}><Text strong>OS Versions:</Text></Col>
            <Col span={18}>
              <Select
                mode="multiple"
                placeholder="Filter by OS versions"
                value={params.operatingSystemVersionNames}
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
                onChange={(e) => handleSearch(e.target.value)}
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
          <DataTable<AdReportData>
            data={tableData} // This should now correctly reflect filtered data
            total={getPaginationTotal()}
            page={params.page}
            pageSize={params.size}
            loading={loading}
            columns={columns}
            onChange={handleTableChange}
            pageSizeOptions={getPageSizeOptions()}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
          />
        </Spin>
      </Card>
    </div>
  );
}