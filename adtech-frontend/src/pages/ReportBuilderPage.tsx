

import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Button, Space, Select, Input, DatePicker, Spin, Card, Row, Col, message } from 'antd'; // <-- ADD 'message' here

import DataTable from '../components/DataTable';
import FilterPanel from '../components/FilterPanel'; // Ensure this is your updated DataTable
import {
  getDimensions, getMetrics, ReportQueryRequest, queryReport, AdReportData, exportReport
} from '../api';
import { debounce } from '../utils/debounce';
import axios from 'axios';
import dayjs from 'dayjs'; // Use dayjs for date handling
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'; // Import TablePaginationConfig here
import type { RangePickerProps } from 'antd/lib/date-picker'; // Import RangePickerProps

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Define QueryParams to match your frontend state needs,
// and ensure it maps to ReportQueryRequest when sent to API.
export interface QueryParams {
  mobileAppNames?: string[];
  inventoryFormatNames?: string[];
  operatingSystemVersionNames?: string[];
  searchQuery?: string;
  groupByDimensions?: string[];
  metrics?: string[];
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export default function ReportBuilderPage() {
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [params, setParams] = useState<QueryParams>({
    groupByDimensions: [],
    metrics: [],
    page: 1,
    pageSize: 10000,
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'), // Default to last 30 days
    endDate: dayjs().format('YYYY-MM-DD'),
    mobileAppNames: [],
    inventoryFormatNames: [],
    operatingSystemVersionNames: [],
    searchQuery: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  });
  const [tableData, setTableData] = useState<AdReportData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState<boolean>(false); // Add loading state

  useEffect(() => {
    getDimensions()
      .then((r) => setAvailableDimensions(r.data || []))
      .catch((error) => {
        console.error("Error fetching dimensions:", error);
        setAvailableDimensions([]);
      });
    getMetrics()
      .then((r) => setAvailableMetrics(r.data || []))
      .catch((error) => {
        console.error("Error fetching metrics:", error);
        setAvailableMetrics([]);
      });
  }, []);

  const fetchData = useCallback(debounce(async (currentParams: QueryParams) => {
    setLoading(true); // Start loading
    const apiParams: ReportQueryRequest = {
      ...currentParams,
      page: Math.max(1, currentParams.page || 1),
      size: Math.max(1, currentParams.pageSize || 10),
      startDate: currentParams.startDate,
      endDate: currentParams.endDate,
    };

    console.log("Sending API request with parameters:", apiParams);
    console.log(`Page: ${apiParams.page}, Size: ${apiParams.size}`);

    try {
      const resp = await queryReport(apiParams);
      setTableData(resp.data.content || []);
      setTotal(resp.data.totalElements || 0);
    } catch (error) {
      console.error("Error fetching report data:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend Error Response:", error.response.data);
      }
      setTableData([]);
      setTotal(0);
    } finally {
      setLoading(false); // Stop loading
    }
  }, 500), []);

  useEffect(() => {
    fetchData(params);
  }, [params, fetchData]);

  // Handler for Date Range Filter
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setParams(prev => ({
      ...prev,
      startDate: dateStrings[0],
      endDate: dateStrings[1],
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handler for Multi-Select Filters
  const handleMultiSelectChange = (field: keyof QueryParams) => (values: string[]) => {
    setParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handler for Real-time Search
  const handleSearch = (value: string) => {
    setParams(prev => ({
      ...prev,
      searchQuery: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handler for Dynamic Select (Dimensions/Metrics)
  const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
    setParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handler for DataTable pagination and sorting changes
  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: any,
    sorter: any
  ) => {
    const newPage = Math.max(1, pagination.current || 1);
    const newPageSize = Math.max(1, pagination.pageSize || 10);

    let newSortBy: string | undefined = undefined;
    let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;

    if (sorter && sorter.field) {
      newSortBy = sorter.field.toString();
      newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setParams((oldParams: QueryParams) => ({
      ...oldParams,
      page: newPage,
      pageSize: newPageSize,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    }));
  };

  // Handler for Export CSV
  const handleExportCsv = () => {
    const exportRequest: ReportQueryRequest = {
      ...params,
      size: total, // Export all records matching filters, not just current page
      page: 1, // Ensure page is 1 for export all
    };
    exportReport(exportRequest);
  };

  // --- Dynamic Column Generation for DataTable ---
  // This logic is now in ReportBuilderPage, as DataTable is a generic component
  const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
    if (data.length === 0) {
      return [];
    }

    const allKeys = Object.keys(data[0]);
    const displayKeys = allKeys.filter(key => key !== 'id'); // Filter out 'id' if not needed

    return displayKeys.map(key => ({
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()), // Convert camelCase to Title Case
      dataIndex: key,
      key: key,
      sorter: true, // Enable sorting for all columns
      render: (text: any) => {
        if (key === 'date') {
          return dayjs(text).format('YYYY-MM-DD'); // Use dayjs for formatting
        }
        if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
          return text.toFixed(2);
        }
        return text;
      }
    }));
  };

  const columns = React.useMemo(() => generateColumns(tableData), [tableData]);


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
          <DataTable<AdReportData> // Specify generic type for DataTable
            data={tableData}
            total={total}
            page={params.page}
            pageSize={params.pageSize}
            loading={loading} // Pass loading state
            columns={columns} // Pass the dynamically generated columns
            onChange={handleTableChange} // Pass the full handler
          />
        </Spin>
      </Card>
    </div>
  );
}