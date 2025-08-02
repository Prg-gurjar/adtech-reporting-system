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
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Typography, Button, Space, Select, Input, DatePicker, Spin, Card, Row, Col, message } from 'antd';
import DataTable from '../components/DataTable';
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

// Define constants for page sizes and options
const DEFAULT_PAGE_SIZE = 100;
const SEARCH_PAGE_SIZE = 10000;
const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
const SEARCH_PAGE_SIZE_OPTIONS = ['10', '20', '50', '100', '1000', '10000'];

// Static lists for filters to prevent unnecessary re-renders
const STATIC_DIMENSION_OPTIONS = ["mobileAppResolvedId", "mobileAppName", "domain", "adUnitName", "adUnitId", "inventoryFormatName", "operatingSystemVersionName", "date"];
const STATIC_METRIC_OPTIONS = ["adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate", "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks", "adExchangeLineItemLevelCtr", "averageEcpm", "payout"];

export default function ReportBuilderPage() {
  const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [params, setParams] = useState<ReportQueryRequest>({
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
  const [tableData, setTableData] = useState<AdReportData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  // New state for search input to be applied later
  const [searchInputValue, setSearchInputValue] = useState<string>('');

  // --- API Calls for Dimensions and Metrics ---
  useEffect(() => {
    getDimensions().then(r => setAvailableDimensions(r || [])).catch(error => {
      message.error('Failed to fetch dimensions.');
      console.error("Error fetching dimensions:", error);
      setAvailableDimensions(STATIC_DIMENSION_OPTIONS);
    });
    getMetrics().then(r => setAvailableMetrics(r || [])).catch(error => {
      message.error('Failed to fetch metrics.');
      console.error("Error fetching metrics:", error);
      setAvailableMetrics(STATIC_METRIC_OPTIONS);
    });
  }, []);

  // --- Debounced Data Fetching Logic ---
  const fetchData = useCallback(debounce(async (currentParams: ReportQueryRequest) => {
    setLoading(true);
    const apiParams: ReportQueryRequest = {
      ...currentParams,
      page: Math.max(1, currentParams.page || 1),
      size: currentParams.size,
      startDate: currentParams.startDate,
      endDate: currentParams.endDate,
    };
    try {
      const resp = await queryReport(apiParams);
      setTableData(resp.content || []);
      setTotal(resp.totalElements || 0);
    } catch (error) {
      console.error("Error fetching report data:", error);
      message.error('Failed to fetch report data.');
      setTableData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, 500), []);
  

  

  useEffect(() => {
    fetchData(params);
  }, [params, fetchData]);

  // --- Handlers for Filters and Table ---
  const updateParams = (newValues: Partial<ReportQueryRequest>) => {
    setParams(prev => ({ ...prev, page: 1, ...newValues }));
  };

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    updateParams({ startDate: dateStrings[0], endDate: dateStrings[1] });
  };

  const handleMultiSelectChange = (field: keyof ReportQueryRequest) => (values: string[]) => {
    updateParams({ [field]: values });
  };
  
  // New "Apply" button for search
  const handleSearchApply = () => {
    const newSize = searchInputValue ? SEARCH_PAGE_SIZE : DEFAULT_PAGE_SIZE;
    updateParams({
      searchQuery: searchInputValue || undefined,
      size: newSize,
    });
  };

  const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
    updateParams({ [field]: values });
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: any,
    sorter: any
  ) => {
    const newPage = Math.max(1, pagination.current || 1);
    const newSize = Math.max(1, pagination.pageSize || DEFAULT_PAGE_SIZE);
    
    let newSortBy: string | undefined = undefined;
    let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;
    if (sorter && sorter.field) {
      newSortBy = sorter.field.toString();
      newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setParams((oldParams) => ({
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
      size: total > 0 ? total : 1,
      page: 1,
    };
    exportReport(exportRequest).catch(() => message.error('Failed to export CSV.'));
  };

  // --- Dynamic Column Generation for DataTable ---
  const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
    const combinedKeys = Array.from(new Set([...(params.groupByDimensions || []), ...(params.metrics || [])]));
    const displayKeys = combinedKeys.length > 0 ? combinedKeys : STATIC_DIMENSION_OPTIONS.concat(STATIC_METRIC_OPTIONS);

    const baseColumns = displayKeys.map(key => ({
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      dataIndex: key,
      key: key,
      sorter: true,
      render: (text: any) => {
        if (key === 'date') {
          return dayjs(text).format('YYYY-MM-DD');
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
      render: (text, record, index) => (params.page - 1) * params.size + index + 1,
    };

    return [serialNumberColumn, ...baseColumns];
  };

  const columns = useMemo(() => generateColumns(tableData), [tableData, params.page, params.size, params.groupByDimensions, params.metrics]);

  const getPageSizeOptions = () => params.searchQuery ? SEARCH_PAGE_SIZE_OPTIONS : PAGE_SIZE_OPTIONS;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5' }}>
      <Title level={2} style={{ color: '#001529' }}>Advanced Reporting Dashboard 📊</Title>

      <Card title={<Text strong>Report Filters & Builder</Text>} style={{ marginBottom: '20px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Date Range</Text>
              <RangePicker
                value={[params.startDate ? dayjs(params.startDate) : null, params.endDate ? dayjs(params.endDate) : null]}
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
              <Text strong style={{ marginTop: '16px' }}>Group By Dimensions</Text>
              <Select
                mode="multiple"
                placeholder="Select dimensions to group by"
                value={params.groupByDimensions}
                onChange={handleDynamicSelectChange('groupByDimensions')}
                style={{ width: '100%' }}
                allowClear
              >
                {availableDimensions.map(dim => (
                  <Option key={dim} value={dim}>{dim.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Option>
                ))}
              </Select>
              <Text strong style={{ marginTop: '16px' }}>Metrics</Text>
              <Select
                mode="multiple"
                placeholder="Select metrics to display"
                value={params.metrics}
                onChange={handleDynamicSelectChange('metrics')}
                style={{ width: '100%' }}
                allowClear
              >
                {availableMetrics.map(metric => (
                  <Option key={metric} value={metric}>{metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Filter by App Names</Text>
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
              <Text strong style={{ marginTop: '16px' }}>Filter by Inventory Formats</Text>
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
              <Text strong style={{ marginTop: '16px' }}>Filter by OS Versions</Text>
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
              <Text strong style={{ marginTop: '16px' }}>Search across fields</Text>
              <Space>
                <Input
                  placeholder="Enter search query"
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  style={{ width: 'calc(100% - 80px)' }}
                />
                <Button type="primary" onClick={handleSearchApply}>
                  Apply
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Button type="primary" onClick={handleExportCsv} style={{ marginRight: '8px' }}>
            Export Current Report CSV
          </Button>
          <Button onClick={() => message.info('Save/Load Report functionality coming soon!')}>
            Save/Load Report (Future)
          </Button>
        </div>
      </Card>
      
      <Card title={<Text strong>Report Data</Text>} style={{ marginBottom: '20px' }}>
        <Spin spinning={loading}>
          <DataTable<AdReportData>
            data={tableData}
            total={total}
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
