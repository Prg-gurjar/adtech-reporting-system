import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Typography, Card, Row, Col, Space, Select, Input, DatePicker, Button, Spin, Table, message
} from 'antd';
import {
  getDimensions, getMetrics, queryReport, aggregateReport, exportReport,
  getDistinctMobileAppNames, getDistinctInventoryFormatNames, getDistinctOperatingSystemVersionNames, // NEW IMPORTS
  ReportQueryRequest, AdReportData
} from '../api';
import { debounce } from '../utils/debounce';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/lib/date-picker';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import axios from 'axios';
import {
  DollarCircleOutlined,
  DashboardOutlined,
  LineChartOutlined,
  InteractionOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SummaryMetrics {
  totalRequests: number;
  totalImpressions: number;
  totalClicks: number;
  totalPayout: number;
  averageEcpm: number;
}

const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

const DashboardPage = () => {
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);

  // NEW STATE VARIABLES for distinct filter options
  const [distinctMobileAppNames, setDistinctMobileAppNames] = useState<string[]>([]);
  const [distinctInventoryFormatNames, setDistinctInventoryFormatNames] = useState<string[]>([]);
  const [distinctOperatingSystemVersionNames, setDistinctOperatingSystemVersionNames] = useState<string[]>([]);

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
    size: DEFAULT_PAGE_SIZE,
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    mobileAppNames: [],
    inventoryFormatNames: [],
    operatingSystemVersionNames: [],
    searchQuery: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  });

  // --- API Calls for Dimensions, Metrics, and Distinct Filter Options (run once) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dims, mets, appNames, inventoryFormats, osVersions] = await Promise.all([
          getDimensions(),
          getMetrics(),
          getDistinctMobileAppNames(), // Fetch distinct app names
          getDistinctInventoryFormatNames(), // Fetch distinct inventory formats
          getDistinctOperatingSystemVersionNames(), // Fetch distinct OS versions
        ]);
        setAvailableDimensions(dims || []);
        setAvailableMetrics(mets || []);
        setDistinctMobileAppNames(appNames || []);
        setDistinctInventoryFormatNames(inventoryFormats || []);
        setDistinctOperatingSystemVersionNames(osVersions || []);
      } catch (err) {
        message.error('Failed to fetch initial data (dimensions, metrics, or filter options).');
        console.error("Error fetching initial data:", err);
      }
    };
    fetchInitialData();
  }, []); // Empty dependency array means this runs once on mount

  // --- Data Fetching Logic (debounced and memoized) ---
  const fetchReportData = useCallback(debounce(async (params: ReportQueryRequest) => {
    setLoading(true);
    try {
      const response = await queryReport(params);
      setTableData(response.content || []);
      setTotalRecords(response.totalElements || 0);
    } catch (error) {
      console.error("Error fetching report data:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend Error Response (Report Data):", error.response.data);
        message.error(`Error fetching report data: ${error.response.data.message || 'Unknown error'}`);
      } else {
        message.error('Failed to fetch report data. Please check network.');
      }
      setTableData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, 500), []);

  const fetchSummaryData = useCallback(debounce(async (params: ReportQueryRequest) => {
    // Only fetch summary if availableMetrics are loaded
    if (availableMetrics.length === 0) return;

    try {
      const request: ReportQueryRequest = {
        startDate: params.startDate,
        endDate: params.endDate,
        mobileAppNames: params.mobileAppNames,
        inventoryFormatNames: params.inventoryFormatNames,
        operatingSystemVersionNames: params.operatingSystemVersionNames,
        searchQuery: params.searchQuery,
        metrics: availableMetrics, // Use all available metrics for summary
        groupByDimensions: [], // No grouping for overall summary
        page: 1,
        size: 1 // Only need one row for total summary
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
        message.error(`Error fetching summary data: ${error.response.data.message || 'Unknown error'}`);
      } else {
        message.error('Failed to fetch summary data. Please check network.');
      }
      setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
    }
  }, 500), [availableMetrics]); // Dependency on availableMetrics

  useEffect(() => {
    // Trigger data fetching only when dimensions and metrics are loaded
    if (availableDimensions.length > 0 && availableMetrics.length > 0) {
      fetchReportData(queryParams);
      fetchSummaryData(queryParams);
    }
  }, [queryParams, availableDimensions, availableMetrics, fetchReportData, fetchSummaryData]);

  // --- Consolidated Handlers for Filters and Table ---
  const updateQueryParams = useCallback((newValues: Partial<ReportQueryRequest>) => {
    setQueryParams(prev => ({ ...prev, page: 1, ...newValues }));
  }, []);

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    updateQueryParams({ startDate: dateStrings[0], endDate: dateStrings[1] });
  };

  const handleMultiSelectChange = (field: keyof ReportQueryRequest) => (values: string[]) => {
    updateQueryParams({ [field]: values });
  };

  const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
    updateQueryParams({ [field]: values });
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: any,
    sorter: SorterResult<AdReportData> | SorterResult<AdReportData>[]
  ) => {
    const newPage = Math.max(1, pagination.current || 1);
    const newSize = Math.max(1, pagination.pageSize || DEFAULT_PAGE_SIZE);

    let newSortBy: string | undefined = undefined;
    let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;
    if (sorter && !Array.isArray(sorter) && sorter.field) {
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
      size: totalRecords > 0 ? totalRecords : 1, // Export all filtered records
      page: 1, // Always export from the first page
    };
    exportReport(exportRequest);
  };

  // Apply Filters button handler
  const handleApplyFilters = () => {
    // This will trigger the useEffect to fetch data with current queryParams
    // and reset pagination to page 1, size 100
    setQueryParams(prev => ({
      ...prev,
      page: 1,
      size: DEFAULT_PAGE_SIZE,
    }));
  };

  // Reset Filters button handler
  const handleResetFilters = () => {
    const defaultParams = {
      groupByDimensions: [],
      metrics: [],
      page: 1,
      size: DEFAULT_PAGE_SIZE,
      startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
      mobileAppNames: [],
      inventoryFormatNames: [],
      operatingSystemVersionNames: [],
      searchQuery: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };
    setQueryParams(defaultParams);
  };

  // --- Dynamic Column Generation for Table ---
  const generateColumns = useCallback((): ColumnsType<AdReportData> => {
    let keys: string[] = Array.from(new Set([...(queryParams.groupByDimensions || []), ...(queryParams.metrics || [])]));
    if (keys.length === 0) {
      keys = [...availableDimensions, ...availableMetrics];
    }
    keys = keys.filter(key => key !== 'id');

    const baseColumns = keys.map(key => ({
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      dataIndex: key,
      key: key,
      sorter: true,
      render: (text: any) => {
        if (key === 'date') {
          return text ? dayjs(text).format('YYYY-MM-DD') : '';
        }
        if (typeof text === 'number' && (['ecpm', 'payout', 'ctr', 'rate']).some(term => key.toLowerCase().includes(term))) {
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
  }, [queryParams, availableDimensions, availableMetrics]);

  const columns = useMemo(() => generateColumns(), [generateColumns]);

  const getPaginationTotal = useMemo(() => {
    return totalRecords;
  }, [totalRecords]);

  // --- Render ---
  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#001529' }}>Ad Reporting Dashboard 📈</Title>

      {/* Summary Cards */}
      <Card title={<Text strong>Summary Metrics</Text>} style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ backgroundColor: '#e6f7ff' }}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Text>Total Requests</Text>
                <Text strong>{summaryData.totalRequests.toLocaleString()}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ backgroundColor: '#fffbe6' }}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <EyeOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                <Text>Impressions</Text>
                <Text strong>{summaryData.totalImpressions.toLocaleString()}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ backgroundColor: '#f9f0ff' }}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <InteractionOutlined style={{ fontSize: '24px', color: '#9254de' }} />
                <Text>Clicks</Text>
                <Text strong>{summaryData.totalClicks.toLocaleString()}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ backgroundColor: '#e6fffb' }}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <DollarCircleOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />
                <Text>Total Payout</Text>
                <Text strong>${summaryData.totalPayout.toFixed(2)}</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card style={{ backgroundColor: '#e6f7ff' }}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <LineChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Text>Avg. eCPM</Text>
                <Text strong>${summaryData.averageEcpm.toFixed(2)}</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Advanced Reporting Interface */}
      <Card title={<Text strong>Report Filters & Builder</Text>} style={{ marginBottom: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={8}><Text strong>Date Range:</Text></Col>
                <Col span={16}>
                  <RangePicker
                    value={[queryParams.startDate ? dayjs(queryParams.startDate) : null, queryParams.endDate ? dayjs(queryParams.endDate) : null]}
                    onChange={handleDateRangeChange}
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Text strong>Dimensions:</Text></Col>
                <Col span={16}>
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
              <Row gutter={16}>
                <Col span={8}><Text strong>Metrics:</Text></Col>
                <Col span={16}>
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
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={8}><Text strong>App Names:</Text></Col>
                <Col span={16}>
                  <Select
                    mode="multiple"
                    placeholder="Filter by app names"
                    value={queryParams.mobileAppNames}
                    onChange={handleMultiSelectChange('mobileAppNames')}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {/* Dynamically populate options from distinctMobileAppNames */}
                    {distinctMobileAppNames.map(appName => (
                      <Option key={appName} value={appName}>{appName}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Text strong>Inventory Formats:</Text></Col>
                <Col span={16}>
                  <Select
                    mode="multiple"
                    placeholder="Filter by inventory formats"
                    value={queryParams.inventoryFormatNames}
                    onChange={handleMultiSelectChange('inventoryFormatNames')}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {/* Dynamically populate options from distinctInventoryFormatNames */}
                    {distinctInventoryFormatNames.map(format => (
                      <Option key={format} value={format}>{format}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}><Text strong>OS Versions:</Text></Col>
                <Col span={16}>
                  <Select
                    mode="multiple"
                    placeholder="Filter by OS versions"
                    value={queryParams.operatingSystemVersionNames}
                    onChange={handleMultiSelectChange('operatingSystemVersionNames')}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    {/* Dynamically populate options from distinctOperatingSystemVersionNames */}
                    {distinctOperatingSystemVersionNames.map(osVersion => (
                      <Option key={osVersion} value={osVersion}>{osVersion}</Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
        {/* Buttons */}
        <Row gutter={16} style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <Col>
            <Space>
              <Button onClick={handleResetFilters}>
                Reset Filters
              </Button>
              <Button type="primary" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" onClick={handleExportCsv}>
                Export Report
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <Card title={<Text strong>Detailed Report Data</Text>}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.size,
              total: getPaginationTotal,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
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
};

export default DashboardPage;
