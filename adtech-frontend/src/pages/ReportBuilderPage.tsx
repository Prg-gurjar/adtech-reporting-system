// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { Typography, Button, Space, Select, Input, DatePicker, Spin, Card, Row, Col, message } from 'antd';
// import DataTable from '../components/DataTable';
// import {
//   getDimensions, getMetrics, ReportQueryRequest, queryReport, AdReportData, exportReport
// } from '../api';
// import { debounce } from '../utils/debounce';
// import axios from 'axios';
// import dayjs from 'dayjs';
// import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
// import type { RangePickerProps } from 'antd/lib/date-picker';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Search } = Input;
// const { RangePicker } = DatePicker;

// // Define constants for page sizes and options
// const DEFAULT_PAGE_SIZE = 100;
// const SEARCH_PAGE_SIZE = 10000;
// const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
// const SEARCH_PAGE_SIZE_OPTIONS = ['10', '20', '50', '100', '1000', '10000'];

// // Static lists for filters to prevent unnecessary re-renders
// const STATIC_DIMENSION_OPTIONS = ["mobileAppResolvedId", "mobileAppName", "domain", "adUnitName", "adUnitId", "inventoryFormatName", "operatingSystemVersionName", "date"];
// const STATIC_METRIC_OPTIONS = ["adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate", "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks", "adExchangeLineItemLevelCtr", "averageEcpm", "payout"];

// export default function ReportBuilderPage() {
//   const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
//   const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
//   const [params, setParams] = useState<ReportQueryRequest>({
//     groupByDimensions: [],
//     metrics: [],
//     page: 1,
//     size: DEFAULT_PAGE_SIZE,
//     startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
//     endDate: dayjs().format('YYYY-MM-DD'),
//     mobileAppNames: [],
//     inventoryFormatNames: [],
//     operatingSystemVersionNames: [],
//     searchQuery: undefined,
//     sortBy: undefined,
//     sortOrder: undefined,
//   });
//   const [tableData, setTableData] = useState<AdReportData[]>([]);
//   const [total, setTotal] = useState(0);
//   const [loading, setLoading] = useState<boolean>(false);
  
//   // New state for search input to be applied later
//   const [searchInputValue, setSearchInputValue] = useState<string>('');

//   // --- API Calls for Dimensions and Metrics ---
//   useEffect(() => {
//     getDimensions().then(r => setAvailableDimensions(r || [])).catch(error => {
//       message.error('Failed to fetch dimensions.');
//       console.error("Error fetching dimensions:", error);
//       setAvailableDimensions(STATIC_DIMENSION_OPTIONS);
//     });
//     getMetrics().then(r => setAvailableMetrics(r || [])).catch(error => {
//       message.error('Failed to fetch metrics.');
//       console.error("Error fetching metrics:", error);
//       setAvailableMetrics(STATIC_METRIC_OPTIONS);
//     });
//   }, []);

//   // --- Debounced Data Fetching Logic ---
//   const fetchData = useCallback(debounce(async (currentParams: ReportQueryRequest) => {
//     setLoading(true);
//     const apiParams: ReportQueryRequest = {
//       ...currentParams,
//       page: Math.max(1, currentParams.page || 1),
//       size: currentParams.size,
//       startDate: currentParams.startDate,
//       endDate: currentParams.endDate,
//     };
//     try {
//       const resp = await queryReport(apiParams);
//       setTableData(resp.content || []);
//       setTotal(resp.totalElements || 0);
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//       message.error('Failed to fetch report data.');
//       setTableData([]);
//       setTotal(0);
//     } finally {
//       setLoading(false);
//     }
//   }, 500), []);
  

  

//   useEffect(() => {
//     fetchData(params);
//   }, [params, fetchData]);

//   // --- Handlers for Filters and Table ---
//   const updateParams = (newValues: Partial<ReportQueryRequest>) => {
//     setParams(prev => ({ ...prev, page: 1, ...newValues }));
//   };

//   const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
//     updateParams({ startDate: dateStrings[0], endDate: dateStrings[1] });
//   };

//   const handleMultiSelectChange = (field: keyof ReportQueryRequest) => (values: string[]) => {
//     updateParams({ [field]: values });
//   };
  
//   // New "Apply" button for search
//   const handleSearchApply = () => {
//     const newSize = searchInputValue ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE;
//     updateParams({
//       searchQuery: searchInputValue || undefined,
//       size: newSize,
//     });
//   };

//   const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
//     updateParams({ [field]: values });
//   };

//   const handleTableChange = (
//     pagination: TablePaginationConfig,
//     filters: any,
//     sorter: any
//   ) => {
//     const newPage = Math.max(1, pagination.current || 1);
//     const newSize = Math.max(1, pagination.pageSize || DEFAULT_PAGE_SIZE);
    
//     let newSortBy: string | undefined = undefined;
//     let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;
//     if (sorter && sorter.field) {
//       newSortBy = sorter.field.toString();
//       newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
//     }

//     setParams((oldParams) => ({
//       ...oldParams,
//       page: newPage,
//       size: newSize,
//       sortBy: newSortBy,
//       sortOrder: newSortOrder,
//     }));
//   };

//   const handleExportCsv = () => {
//     const exportRequest: ReportQueryRequest = {
//       ...params,
//       size: total > 0 ? total : 1,
//       page: 1,
//     };
//     exportReport(exportRequest).catch(() => message.error('Failed to export CSV.'));
//   };

//   // --- Dynamic Column Generation for DataTable ---
//   const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
//     const combinedKeys = Array.from(new Set([...(params.groupByDimensions || []), ...(params.metrics || [])]));
//     const displayKeys = combinedKeys.length > 0 ? combinedKeys : STATIC_DIMENSION_OPTIONS.concat(STATIC_METRIC_OPTIONS);

//     const baseColumns = displayKeys.map(key => ({
//       title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
//       dataIndex: key,
//       key: key,
//       sorter: true,
//       render: (text: any) => {
//         if (key === 'date') {
//           return dayjs(text).format('YYYY-MM-DD');
//         }
//         if (typeof text === 'number' && (['ecpm', 'payout', 'ctr', 'rate']).some(term => key.toLowerCase().includes(term))) {
//           return text.toFixed(2);
//         }
//         return text;
//       }
//     }));

//     const serialNumberColumn: ColumnsType<AdReportData>[0] = {
//       title: 'S.No.',
//       key: 'serialNumber',
//       width: 70,
//       fixed: 'left',
//       render: (text, record, index) => (params.page - 1) * params.size + index + 1,
//     };

//     return [serialNumberColumn, ...baseColumns];
//   };

//   const columns = useMemo(() => generateColumns(tableData), [tableData, params.page, params.size, params.groupByDimensions, params.metrics]);

//   const getPageSizeOptions = () => params.searchQuery ? SEARCH_PAGE_SIZE_OPTIONS : PAGE_SIZE_OPTIONS;

//   return (
//     <div style={{ padding: '20px', backgroundColor: '#f0f2f5' }}>
//       <Title level={2} style={{ color: '#001529' }}>Advanced Reporting Dashboard 📊</Title>

//       <Card title={<Text strong>Report Filters & Builder</Text>} style={{ marginBottom: '20px' }}>
//         <Row gutter={[24, 24]}>
//           <Col xs={24} lg={12}>
//             <Space direction="vertical" style={{ width: '100%' }}>
//               <Text strong>Date Range</Text>
//               <RangePicker
//                 value={[params.startDate ? dayjs(params.startDate) : null, params.endDate ? dayjs(params.endDate) : null]}
//                 onChange={handleDateRangeChange}
//                 style={{ width: '100%' }}
//                 format="YYYY-MM-DD"
//               />
//               <Text strong style={{ marginTop: '16px' }}>Group By Dimensions</Text>
//               <Select
//                 mode="multiple"
//                 placeholder="Select dimensions to group by"
//                 value={params.groupByDimensions}
//                 onChange={handleDynamicSelectChange('groupByDimensions')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {availableDimensions.map(dim => (
//                   <Option key={dim} value={dim}>{dim.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Option>
//                 ))}
//               </Select>
//               <Text strong style={{ marginTop: '16px' }}>Metrics</Text>
//               <Select
//                 mode="multiple"
//                 placeholder="Select metrics to display"
//                 value={params.metrics}
//                 onChange={handleDynamicSelectChange('metrics')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {availableMetrics.map(metric => (
//                   <Option key={metric} value={metric}>{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Option>
//                 ))}
//               </Select>
//             </Space>
//           </Col>
//           <Col xs={24} lg={12}>
//             <Space direction="vertical" style={{ width: '100%' }}>
//               <Text strong>Filter by App Names</Text>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by app names"
//                 value={params.mobileAppNames}
//                 onChange={handleMultiSelectChange('mobileAppNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="Gangs Town Story: Grand Crime">Gangs Town Story: Grand Crime</Option>
//                 <Option value="Funny Supermarket game">Funny Supermarket game</Option>
//               </Select>
//               <Text strong style={{ marginTop: '16px' }}>Filter by Inventory Formats</Text>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by inventory formats"
//                 value={params.inventoryFormatNames}
//                 onChange={handleMultiSelectChange('inventoryFormatNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="Banner">Banner</Option>
//                 <Option value="Rewarded">Rewarded</Option>
//               </Select>
//               <Text strong style={{ marginTop: '16px' }}>Filter by OS Versions</Text>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by OS versions"
//                 value={params.operatingSystemVersionNames}
//                 onChange={handleMultiSelectChange('operatingSystemVersionNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="iOS 15.3">iOS 15.3</Option>
//                 <Option value="iOS 16.7">iOS 16.7</Option>
//               </Select>
//               <Text strong style={{ marginTop: '16px' }}>Search across fields</Text>
//               <Space>
//                 <Input
//                   placeholder="Enter search query"
//                   value={searchInputValue}
//                   onChange={(e) => setSearchInputValue(e.target.value)}
//                   style={{ width: 'calc(100% - 80px)' }}
//                 />
//                 <Button type="primary" onClick={handleSearchApply}>
//                   Apply
//                 </Button>
//               </Space>
//             </Space>
//           </Col>
//         </Row>
//         <div style={{ marginTop: '24px', textAlign: 'right' }}>
//           <Button type="primary" onClick={handleExportCsv} style={{ marginRight: '8px' }}>
//             Export Current Report CSV
//           </Button>
//           <Button onClick={() => message.info('Save/Load Report functionality coming soon!')}>
//             Save/Load Report (Future)
//           </Button>
//         </div>
//       </Card>
      
//       <Card title={<Text strong>Report Data</Text>} style={{ marginBottom: '20px' }}>
//         <Spin spinning={loading}>
//           <DataTable<AdReportData>
//             data={tableData}
//             total={total}
//             page={params.page}
//             pageSize={params.size}
//             loading={loading}
//             columns={columns}
//             onChange={handleTableChange}
//             pageSizeOptions={getPageSizeOptions()}
//             showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
//           />
//         </Spin>
//       </Card>
//     </div>
//   );
// }


import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  DatePicker,
  Button,
  Select,
  Input,
  Space,
  Spin,
  Alert,
  Modal,
  notification,
  Form,
  Row,
  Col,
} from 'antd';
import { DownloadOutlined, UploadOutlined, SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import {
  getDimensions, getMetrics, queryReport, aggregateReport, exportReport,
  getDistinctMobileAppNames, getDistinctInventoryFormatNames, getDistinctOperatingSystemVersionNames,
  ReportQueryRequest, AdReportDto // <--- CRITICAL FIX: Changed AdReportData to AdReportDto here
} from '../api';
import { debounce } from '../utils/debounce';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DataType {
  key: React.Key;
  [key: string]: any;
}

const ReportBuilderPage: React.FC = () => {
  // <--- CRITICAL FIX: Changed AdReportData[] to AdReportDto[] here
  const [reportData, setReportData] = useState<AdReportDto[]>([]);
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs().subtract(30, 'days'));
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [distinctMobileAppNames, setDistinctMobileAppNames] = useState<string[]>([]);
  const [distinctInventoryFormatNames, setDistinctInventoryFormatNames] = useState<string[]>([]);
  const [distinctOperatingSystemVersionNames, setDistinctOperatingSystemVersionNames] = useState<string[]>([]);
  const [selectedMobileAppNames, setSelectedMobileAppNames] = useState<string[]>([]);
  const [selectedInventoryFormatNames, setSelectedInventoryFormatNames] = useState<string[]>([]);
  const [selectedOperatingSystemVersionNames, setSelectedOperatingSystemVersionNames] = useState<string[]>([]);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form] = Form.useForm();

  const fetchDistinctValues = useCallback(async () => {
    try {
      setLoading(true);
      const [apps, formats, osVersions] = await Promise.all([
        getDistinctMobileAppNames(),
        getDistinctInventoryFormatNames(),
        getDistinctOperatingSystemVersionNames(),
      ]);
      setDistinctMobileAppNames(apps);
      setDistinctInventoryFormatNames(formats);
      setDistinctOperatingSystemVersionNames(osVersions);
    } catch (error) {
      console.error('Failed to fetch distinct values:', error);
      message.error('Failed to load filter options.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [dims, mets] = await Promise.all([getDimensions(), getMetrics()]);
        setDimensions(dims);
        setMetrics(mets);
      } catch (error) {
        console.error('Failed to fetch dimensions or metrics:', error);
        message.error('Failed to load report configuration.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
    fetchDistinctValues();
  }, [fetchDistinctValues]);

  const getReport = useCallback(async (page: number, size: number, sortBy?: string, sortOrder?: 'ASC' | 'DESC') => {
    setLoading(true);
    try {
      const query: ReportQueryRequest = {
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        mobileAppNames: selectedMobileAppNames.length > 0 ? selectedMobileAppNames : undefined,
        inventoryFormatNames: selectedInventoryFormatNames.length > 0 ? selectedInventoryFormatNames : undefined,
        operatingSystemVersionNames: selectedOperatingSystemVersionNames.length > 0 ? selectedOperatingSystemVersionNames : undefined,
        searchQuery: searchQuery || undefined,
        groupByDimensions: selectedDimensions.length > 0 ? selectedDimensions : undefined,
        metrics: selectedMetrics.length > 0 ? selectedMetrics : undefined,
        page: page,
        size: size,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };
      const response = await queryReport(query);
      setReportData(response.content); // This now correctly receives AdReportDto[]
      setTotalElements(response.totalElements);
      setCurrentPage(page);
      setPageSize(size);

      const aggregateResponse = await aggregateReport(query);
      setAggregatedData(aggregateResponse);

    } catch (error) {
      console.error('Failed to fetch report data:', error);
      message.error('Failed to load report data.');
      setReportData([]);
      setAggregatedData([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedMobileAppNames, selectedInventoryFormatNames, selectedOperatingSystemVersionNames, searchQuery, selectedDimensions, selectedMetrics]);

  useEffect(() => {
    getReport(currentPage, pageSize);
  }, [getReport, currentPage, pageSize]);

  const handleTableChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter) => {
    const { current, pageSize } = pagination;
    const { field, order } = sorter as { field?: string; order?: string };
    const sortOrder = order === 'ascend' ? 'ASC' : order === 'descend' ? 'DESC' : undefined;
    getReport(current || 1, pageSize || 100, field, sortOrder);
  };

  const handleSearch = debounce(() => {
    getReport(1, pageSize);
  }, 500);

  const handleResetFilters = () => {
    form.resetFields();
    setStartDate(dayjs().subtract(30, 'days'));
    setEndDate(dayjs());
    setSelectedMobileAppNames([]);
    setSelectedInventoryFormatNames([]);
    setSelectedOperatingSystemVersionNames([]);
    setSearchQuery('');
    setSelectedDimensions([]);
    setSelectedMetrics([]);
    getReport(1, pageSize);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const query: ReportQueryRequest = {
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        mobileAppNames: selectedMobileAppNames.length > 0 ? selectedMobileAppNames : undefined,
        inventoryFormatNames: selectedInventoryFormatNames.length > 0 ? selectedInventoryFormatNames : undefined,
        operatingSystemVersionNames: selectedOperatingSystemVersionNames.length > 0 ? selectedOperatingSystemVersionNames : undefined,
        searchQuery: searchQuery || undefined,
        groupByDimensions: selectedDimensions.length > 0 ? selectedDimensions : undefined,
        metrics: selectedMetrics.length > 0 ? selectedMetrics : undefined,
        page: 1, // Export all data, not just current page
        size: totalElements, // Fetch all elements for export
      };
      await exportReport(query);
    } catch (error) {
      console.error('Failed to export report:', error);
      message.error('Failed to export report.');
    } finally {
      setLoading(false);
    }
  };

  const showUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  const handleUploadOk = async () => {
    if (selectedFile) {
      setLoading(true);
      try {
        const responseMessage = await uploadCsvData(selectedFile);
        notification.success({
          message: 'CSV Upload Initiated',
          description: responseMessage,
          placement: 'bottomRight',
        });
        setIsUploadModalVisible(false);
        setSelectedFile(null);
        getReport(currentPage, pageSize);
      } catch (error) {
        console.error('Upload failed:', error);
        notification.error({
          message: 'CSV Upload Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
          placement: 'bottomRight',
        });
      } finally {
        setLoading(false);
      }
    } else {
      message.warning('Please select a file to upload.');
    }
  };

  const handleUploadCancel = () => {
    setIsUploadModalVisible(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // <--- CRITICAL FIX: Changed AdReportData to AdReportDto here
  const getColumns = (): TableProps<AdReportDto>['columns'] => {
    if (reportData.length === 0) {
      return [];
    }

    const firstItem = reportData[0];
    return Object.keys(firstItem).map(key => ({
      title: formatColumnHeader(key),
      dataIndex: key,
      key: key,
      sorter: true,
      render: (text: any) => {
        if (key === 'date' && text) {
          return dayjs(text).format('YYYY-MM-DD');
        }
        if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
          return text.toFixed(2);
        }
        return text;
      },
    }));
  };

  const formatColumnHeader = (key: string): string => {
    return key.replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const getAggregatedColumns = (): TableProps<any>['columns'] => {
    if (aggregatedData.length === 0) {
      return [];
    }

    const firstItem = aggregatedData[0];
    return Object.keys(firstItem).map(key => ({
      title: formatColumnHeader(key),
      dataIndex: key,
      key: key,
      render: (text: any) => {
        if (key === 'date' && text) {
          return dayjs(text).format('YYYY-MM-DD');
        }
        if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
          return text.toFixed(2);
        }
        return text;
      },
    }));
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Ad Report Dashboard</h1>

      <Form form={form} layout="vertical" onFinish={() => getReport(1, pageSize)}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Date Range">
              <RangePicker
                value={[startDate, endDate]}
                onChange={(dates) => {
                  setStartDate(dates ? dates[0] : null);
                  setEndDate(dates ? dates[1] : null);
                }}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Mobile App Names">
              <Select
                mode="multiple"
                placeholder="Select Apps"
                value={selectedMobileAppNames}
                onChange={setSelectedMobileAppNames}
                style={{ width: '100%' }}
                loading={loading}
                options={distinctMobileAppNames.map(name => ({ value: name, label: name }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Inventory Formats">
              <Select
                mode="multiple"
                placeholder="Select Formats"
                value={selectedInventoryFormatNames}
                onChange={setSelectedInventoryFormatNames}
                style={{ width: '100%' }}
                loading={loading}
                options={distinctInventoryFormatNames.map(name => ({ value: name, label: name }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="OS Versions">
              <Select
                mode="multiple"
                placeholder="Select OS Versions"
                value={selectedOperatingSystemVersionNames}
                onChange={setSelectedOperatingSystemVersionNames}
                style={{ width: '100%' }}
                loading={loading}
                options={distinctOperatingSystemVersionNames.map(name => ({ value: name, label: name }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Search Query">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Group By Dimensions">
              <Select
                mode="multiple"
                placeholder="Select dimensions to group by"
                value={selectedDimensions}
                onChange={setSelectedDimensions}
                style={{ width: '100%' }}
                options={dimensions.map(dim => ({ value: dim, label: formatColumnHeader(dim) }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Metrics">
              <Select
                mode="multiple"
                placeholder="Select metrics"
                value={selectedMetrics}
                onChange={setSelectedMetrics}
                style={{ width: '100%' }}
                options={metrics.map(metric => ({ value: metric, label: formatColumnHeader(metric) }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item label="Actions">
              <Space>
                <Button type="primary" onClick={() => getReport(1, pageSize)} icon={<FilterOutlined />}>
                  Apply Filters
                </Button>
                <Button onClick={handleResetFilters} icon={<ClearOutlined />}>
                  Reset
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Space style={{ marginBottom: 16, marginTop: 16 }}>
        <Button onClick={handleExport} icon={<DownloadOutlined />} loading={loading}>
          Export to CSV
        </Button>
        <Button onClick={showUploadModal} icon={<UploadOutlined />}>
          Upload CSV
        </Button>
      </Space>

      {loading && <Spin tip="Loading data..." style={{ display: 'block', margin: '20px auto' }} />}
      {!loading && reportData.length === 0 && (
        <Alert message="No data available for the selected filters." type="info" showIcon />
      )}

      {!loading && reportData.length > 0 && (
        <>
          <h2 style={{ marginTop: 24, marginBottom: 16 }}>Detailed Report</h2>
          <Table
            columns={getColumns()}
            dataSource={reportData.map(item => ({ ...item, key: item.id }))}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalElements,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            bordered
          />
        </>
      )}

      {!loading && aggregatedData.length > 0 && (
        <>
          <h2 style={{ marginTop: 24, marginBottom: 16 }}>Aggregated Report</h2>
          <Table
            columns={getAggregatedColumns()}
            dataSource={aggregatedData.map((item, index) => ({ ...item, key: index }))}
            pagination={false}
            loading={loading}
            scroll={{ x: 'max-content' }}
            bordered
          />
        </>
      )}

      <Modal
        title="Upload CSV File"
        visible={isUploadModalVisible}
        onOk={handleUploadOk}
        onCancel={handleUploadCancel}
        okText="Upload"
        cancelText="Cancel"
      >
        <Input type="file" accept=".csv" onChange={handleFileChange} />
        {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      </Modal>
    </div>
  );
};

export default ReportBuilderPage;
