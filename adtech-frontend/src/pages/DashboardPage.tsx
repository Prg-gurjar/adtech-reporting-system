

// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   Typography, Card, Row, Col, Space, Select, Input, DatePicker, Button, Spin, Table, message
// } from 'antd';
// import {
//   getDimensions, getMetrics, queryReport, aggregateReport, exportReport,
//   ReportQueryRequest, AdReportData
// } from '../api';
// import { debounce } from '../utils/debounce';
// import dayjs from 'dayjs'; // <--- FIX: Import dayjs instead of moment
// import type { RangePickerProps } from 'antd/lib/date-picker'; // <--- FIX: Correct import path for RangePickerProps
// import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'; // <--- FIX: Import TablePaginationConfig here
// import axios from 'axios';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Search } = Input;
// const { RangePicker } = DatePicker;

// // Define a type for the query parameters used in the frontend state
// interface DashboardQueryParams {
//   startDate?: string;
//   endDate?: string;
//   mobileAppNames?: string[];
//   inventoryFormatNames?: string[];
//   operatingSystemVersionNames?: string[];
//   searchQuery?: string;
//   groupByDimensions?: string[];
//   metrics?: string[];
//   page: number;
//   pageSize: number;
//   sortBy?: string;
//   sortOrder?: 'ASC' | 'DESC';
// }

// // Define a type for the aggregated summary data
// interface SummaryMetrics {
//   totalRequests: number;
//   totalImpressions: number;
//   totalClicks: number;
//   totalPayout: number;
//   averageEcpm: number;
// }

// export default function DashboardPage() {
//   const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
//   const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
//   const [tableData, setTableData] = useState<AdReportData[]>([]);
//   const [totalRecords, setTotalRecords] = useState<number>(0);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [summaryData, setSummaryData] = useState<SummaryMetrics>({
//     totalRequests: 0,
//     totalImpressions: 0,
//     totalClicks: 0,
//     totalPayout: 0,
//     averageEcpm: 0,
//   });

//   // State for report query parameters
//   const [queryParams, setQueryParams] = useState<DashboardQueryParams>({
//     groupByDimensions: [],
//     metrics: [],
//     page: 1,
//     pageSize: 10000, // Default page size
//     // FIX: Use dayjs for default dates
//     startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'), // Default to last 30 days
//     endDate: dayjs().format('YYYY-MM-DD'),
//     mobileAppNames: [],
//     inventoryFormatNames: [],
//     operatingSystemVersionNames: [],
//     searchQuery: undefined,
//     sortBy: undefined,
//     sortOrder: undefined,
//   });

//   // --- API Calls ---

//   // Function to fetch available dimensions and metrics
//   useEffect(() => {
//     getDimensions().then(res => setAvailableDimensions(res.data || [])).catch(err => console.error("Error fetching dimensions:", err));
//     getMetrics().then(res => setAvailableMetrics(res.data || [])).catch(err => console.error("Error fetching metrics:", err));
//   }, []);

//   // Debounced function to fetch report data for the table
//   const fetchReportData = useCallback(debounce(async (params: DashboardQueryParams) => {
//     setLoading(true);
//     try {
//       // Map frontend queryParams to backend ReportQueryRequest
//       const request: ReportQueryRequest = {
//         ...params,
//         size: params.pageSize, // Map pageSize to size for backend
//       };
//       const response = await queryReport(request);
//       setTableData(response.data.content || []);
//       setTotalRecords(response.data.totalElements || 0);
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//       if (axios.isAxiosError(error) && error.response) {
//         console.error("Backend Error Response (Report Data):", error.response.data);
//       }
//       setTableData([]);
//       setTotalRecords(0);
//     } finally {
//       setLoading(false);
//     }
//   }, 500), []); // Debounce by 500ms

//   // Debounced function to fetch aggregated summary data
//   const fetchSummaryData = useCallback(debounce(async (params: DashboardQueryParams) => {
//     try {
//       const request: ReportQueryRequest = {
//         startDate: params.startDate,
//         endDate: params.endDate,
//         mobileAppNames: params.mobileAppNames,
//         inventoryFormatNames: params.inventoryFormatNames,
//         operatingSystemVersionNames: params.operatingSystemVersionNames,
//         searchQuery: params.searchQuery,
//         metrics: availableMetrics, // Aggregate all available metrics for summary
//         // No groupByDimensions, page, size for overall summary
//       };
//       const response = await aggregateReport(request);
//       if (response.data && response.data.length > 0) {
//         const aggregated = response.data[0]; // Assuming the first element is the overall aggregate
//         setSummaryData({
//           totalRequests: aggregated.adExchangeTotalRequests || 0,
//           totalImpressions: aggregated.adExchangeLineItemLevelImpressions || 0,
//           totalClicks: aggregated.adExchangeLineItemLevelClicks || 0,
//           totalPayout: aggregated.payout || 0,
//           averageEcpm: aggregated.averageEcpm || 0,
//         });
//       } else {
//         setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
//       }
//     } catch (error) {
//       console.error("Error fetching summary data:", error);
//       if (axios.isAxiosError(error) && error.response) {
//         console.error("Backend Error Response (Summary Data):", error.response.data);
//       }
//       setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
//     }
//   }, 500), [availableMetrics]); // Re-run if availableMetrics change

//   // Trigger data fetches when queryParams change
//   useEffect(() => {
//     fetchReportData(queryParams);
//     fetchSummaryData(queryParams);
//   }, [queryParams, fetchReportData, fetchSummaryData]);

//   // --- Handlers for Filters and Table ---

//   // FIX: Use RangePickerProps['onChange'] directly from 'antd/lib/date-picker'
//   const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
//     setQueryParams(prev => ({
//       ...prev,
//       startDate: dateStrings[0],
//       endDate: dateStrings[1],
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleMultiSelectChange = (field: keyof DashboardQueryParams) => (values: string[]) => {
//     setQueryParams(prev => ({
//       ...prev,
//       [field]: values,
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleSearch = (value: string) => {
//     setQueryParams(prev => ({
//       ...prev,
//       searchQuery: value || undefined, // Set to undefined if empty string
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
//     setQueryParams(prev => ({
//       ...prev,
//       [field]: values,
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleTableChange = (
//     pagination: TablePaginationConfig, // This type is now correctly imported
//     filters: any, // Ant Design's filters type can be complex, using any for brevity
//     sorter: any // Ant Design's sorter type can be complex, using any for brevity
//   ) => {
//     const newPage = Math.max(1, pagination.current || 1);
//     const newPageSize = Math.max(1, pagination.pageSize || 10);

//     let newSortBy: string | undefined = undefined;
//     let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;

//     if (sorter && sorter.field) {
//       newSortBy = sorter.field.toString();
//       newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
//     }

//     setQueryParams(prev => ({
//       ...prev,
//       page: newPage,
//       pageSize: newPageSize,
//       sortBy: newSortBy,
//       sortOrder: newSortOrder,
//     }));
//   };

//   const handleExportCsv = () => {
//     // Use the current queryParams to export the filtered data
//     const exportRequest: ReportQueryRequest = {
//       ...queryParams,
//       size: totalRecords, // Export all records matching filters, not just current page
//       page: 1, // Ensure page is 1 for export all
//     };
//     exportReport(exportRequest);
//   };

//   // --- Dynamic Column Generation for Table ---
//   const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
//     if (data.length === 0) {
//       return [];
//     }

//     // Get all keys from the first data object to create columns
//     const allKeys = Object.keys(data[0]);

//     // Filter out 'id' if you don't want to display it
//     const displayKeys = allKeys.filter(key => key !== 'id');

//     return displayKeys.map(key => ({
//       title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()), // Convert camelCase to Title Case
//       dataIndex: key,
//       key: key,
//       sorter: true, // Enable sorting for all columns
//       // You can add custom renderers for specific columns if needed
//       render: (text: any) => {
//         if (key === 'date') {
//           return dayjs(text).format('YYYY-MM-DD'); // <--- FIX: Use dayjs for formatting
//         }
//         // Format numbers to 2 decimal places if they look like currency/rates
//         if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
//           return text.toFixed(2);
//         }
//         return text;
//       }
//     }));
//   };

//   const columns = React.useMemo(() => generateColumns(tableData), [tableData]);


//   // --- Render ---
//   return (
//     <div style={{ padding: '20px' }}>
//       <Title level={2}>Ad Reporting Dashboard</Title>

//       {/* Summary Cards */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Requests" variant="borderless">
//             <Text strong>{summaryData.totalRequests.toLocaleString()}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Impressions" bordered={false}>
//             <Text strong>{summaryData.totalImpressions.toLocaleString()}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Clicks" bordered={false}>
//             <Text strong>{summaryData.totalClicks.toLocaleString()}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Payout" bordered={false}>
//             <Text strong>${summaryData.totalPayout.toFixed(2)}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Average eCPM" bordered={false}>
//             <Text strong>${summaryData.averageEcpm.toFixed(2)}</Text>
//           </Card>
//         </Col>
//       </Row>

//       {/* Advanced Reporting Interface */}
//       <Card title="Report Filters & Builder" style={{ marginBottom: '20px' }}>
//         <Space direction="vertical" size="middle" style={{ width: '100%' }}>
//           {/* Date Range Filter */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Date Range:</Text></Col>
//             <Col span={18}>
//               <RangePicker
//                 // FIX: Use dayjs objects for value prop
//                 value={[queryParams.startDate ? dayjs(queryParams.startDate) : null, queryParams.endDate ? dayjs(queryParams.endDate) : null]}
//                 onChange={handleDateRangeChange}
//                 style={{ width: '100%' }}
//                 format="YYYY-MM-DD"
//               />
//             </Col>
//           </Row>

//           {/* Dynamic Report Builder: Group By Dimensions */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Group By:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Select dimensions to group by"
//                 value={queryParams.groupByDimensions}
//                 onChange={handleDynamicSelectChange('groupByDimensions')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {availableDimensions.map(dim => (
//                   <Option key={dim} value={dim}>{dim.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Option>
//                 ))}
//               </Select>
//             </Col>
//           </Row>

//           {/* Dynamic Report Builder: Metrics */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Metrics:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Select metrics to display"
//                 value={queryParams.metrics}
//                 onChange={handleDynamicSelectChange('metrics')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {availableMetrics.map(metric => (
//                   <Option key={metric} value={metric}>{metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Option>
//                 ))}
//               </Select>
//             </Col>
//           </Row>

//           {/* Multi-Select Filters */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>App Names:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by app names"
//                 value={queryParams.mobileAppNames}
//                 onChange={handleMultiSelectChange('mobileAppNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {/* These options should ideally come from backend distinct values */}
//                 <Option value="Gangs Town Story: Grand Crime">Gangs Town Story: Grand Crime</Option>
//                 <Option value="Funny Supermarket game">Funny Supermarket game</Option>
//                 {/* ... add more options based on your data */}
//               </Select>
//             </Col>
//           </Row>
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Inventory Formats:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by inventory formats"
//                 value={queryParams.inventoryFormatNames}
//                 onChange={handleMultiSelectChange('inventoryFormatNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="Banner">Banner</Option>
//                 <Option value="Rewarded">Rewarded</Option>
//                 {/* ... add more options */}
//               </Select>
//             </Col>
//           </Row>
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>OS Versions:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by OS versions"
//                 value={queryParams.operatingSystemVersionNames}
//                 onChange={handleMultiSelectChange('operatingSystemVersionNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="iOS 15.3">iOS 15.3</Option>
//                 <Option value="iOS 16.7">iOS 16.7</Option>
//                 {/* ... add more options */}
//               </Select>
//             </Col>
//           </Row>

//           {/* Real-time Search */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Search:</Text></Col>
//             <Col span={18}>
//               <Search
//                 placeholder="Search across fields"
//                 onSearch={handleSearch}
//                 onChange={(e) => handleSearch(e.target.value)} // Live search as user types
//                 style={{ width: '100%' }}
//                 allowClear
//               />
//             </Col>
//           </Row>

//           {/* Action Buttons */}
//           <Row gutter={16} style={{ marginTop: '20px' }}>
//             <Col span={12}>
//               <Button type="primary" onClick={handleExportCsv} block>
//                 Export Current Report CSV
//               </Button>
//             </Col>
//             {/* Save/Load Reports - Placeholder */}
//             <Col span={12}>
//               <Button onClick={() => message.info('Save/Load Report functionality coming soon!')} block>
//                 Save/Load Report (Future)
//               </Button>
//             </Col>
//           </Row>
//         </Space>
//       </Card>

//       {/* Data Table */}
//       <Card title="Report Data" style={{ marginBottom: '20px' }}>
//         <Spin spinning={loading}>
//           <Table
//             columns={columns}
//             dataSource={tableData}
//             rowKey="id" // Assuming 'id' is a unique key for each row
//             pagination={{
//               current: queryParams.page,
//               pageSize: queryParams.pageSize,
//               total: totalRecords,
//               showSizeChanger: true,
//               pageSizeOptions: ['10', '20', '50', '100', '1000', '10000'],
//               showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
//             }}
//             onChange={handleTableChange}
//             scroll={{ x: 'max-content' }} // Enable horizontal scrolling for many columns
//             bordered
//           />
//         </Spin>
//       </Card>
//     </div>
//   );
// }


// src/pages/DashboardPage.tsx

// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   Typography, Card, Row, Col, Space, Select, Input, DatePicker, Button, Spin, Table, message
// } from 'antd';
// import {
//   getDimensions, getMetrics, queryReport, aggregateReport, exportReport,
//   ReportQueryRequest, AdReportData
// } from '../api';
// import { debounce } from '../utils/debounce';
// import dayjs from 'dayjs'; // Use dayjs for date handling
// import type { RangePickerProps } from 'antd/lib/date-picker';
// import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
// import axios from 'axios';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Search } = Input;
// const { RangePicker } = DatePicker;

// // Define a type for the query parameters used in the frontend state
// interface DashboardQueryParams {
//   startDate?: string;
//   endDate?: string;
//   mobileAppNames?: string[];
//   inventoryFormatNames?: string[];
//   operatingSystemVersionNames?: string[];
//   searchQuery?: string;
//   groupByDimensions?: string[];
//   metrics?: string[];
//   page: number;
//   pageSize: number;
//   sortBy?: string;
//   sortOrder?: 'ASC' | 'DESC';
// }

// // Define a type for the aggregated summary data
// interface SummaryMetrics {
//   totalRequests: number;
//   totalImpressions: number;
//   totalClicks: number;
//   totalPayout: number;
//   averageEcpm: number;
// }

// export default function DashboardPage() {
//   const [availableDimensions, setAvailableDimensions] = useState<string[]>([]);
//   const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
//   const [tableData, setTableData] = useState<AdReportData[]>([]);
//   const [totalRecords, setTotalRecords] = useState<number>(0);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [summaryData, setSummaryData] = useState<SummaryMetrics>({
//     totalRequests: 0,
//     totalImpressions: 0,
//     totalClicks: 0,
//     totalPayout: 0,
//     averageEcpm: 0,
//   });

//   // State for report query parameters
//   const [queryParams, setQueryParams] = useState<DashboardQueryParams>({
//     groupByDimensions: [],
//     metrics: [],
//     page: 1,
//     pageSize: 10000, // Default page size
//     startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'), // Default to last 30 days
//     endDate: dayjs().format('YYYY-MM-DD'),
//     mobileAppNames: [],
//     inventoryFormatNames: [],
//     operatingSystemVersionNames: [],
//     searchQuery: undefined,
//     sortBy: undefined,
//     sortOrder: undefined,
//   });

//   // --- API Calls ---

//   // Function to fetch available dimensions and metrics
//   useEffect(() => {
//     getDimensions().then(res => setAvailableDimensions(res.data || [])).catch(err => console.error("Error fetching dimensions:", err));
//     getMetrics().then(res => setAvailableMetrics(res.data || [])).catch(err => console.error("Error fetching metrics:", err));
//   }, []);

//   // Debounced function to fetch report data for the table
//   const fetchReportData = useCallback(debounce(async (params: DashboardQueryParams) => {
//     setLoading(true);
//     try {
//       // Map frontend queryParams to backend ReportQueryRequest
//       const request: ReportQueryRequest = {
//         ...params,
//         size: params.pageSize, // Map pageSize to size for backend
//       };
//       const response = await queryReport(request);
//       setTableData(response.data.content || []);
//       setTotalRecords(response.data.totalElements || 0);
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//       if (axios.isAxiosError(error) && error.response) {
//         console.error("Backend Error Response (Report Data):", error.response.data);
//       }
//       setTableData([]);
//       setTotalRecords(0);
//     } finally {
//       setLoading(false);
//     }
//   }, 500), []); // Debounce by 500ms

//   // Debounced function to fetch aggregated summary data
//   const fetchSummaryData = useCallback(debounce(async (params: DashboardQueryParams) => {
//     try {
//       const request: ReportQueryRequest = {
//         startDate: params.startDate,
//         endDate: params.endDate,
//         mobileAppNames: params.mobileAppNames,
//         inventoryFormatNames: params.inventoryFormatNames,
//         operatingSystemVersionNames: params.operatingSystemVersionNames,
//         searchQuery: params.searchQuery,
//         metrics: availableMetrics, // Aggregate all available metrics for summary
//         // No groupByDimensions, page, size for overall summary
//       };
//       const response = await aggregateReport(request);
//       if (response.data && response.data.length > 0) {
//         const aggregated = response.data[0]; // Assuming the first element is the overall aggregate
//         setSummaryData({
//           totalRequests: aggregated.adExchangeTotalRequests || 0,
//           totalImpressions: aggregated.adExchangeLineItemLevelImpressions || 0,
//           totalClicks: aggregated.adExchangeLineItemLevelClicks || 0,
//           totalPayout: aggregated.payout || 0,
//           averageEcpm: aggregated.averageEcpm || 0,
//         });
//       } else {
//         setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
//       }
//     } catch (error) {
//       console.error("Error fetching summary data:", error);
//       if (axios.isAxiosError(error) && error.response) {
//         console.error("Backend Error Response (Summary Data):", error.response.data);
//       }
//       setSummaryData({ totalRequests: 0, totalImpressions: 0, totalClicks: 0, totalPayout: 0, averageEcpm: 0 });
//     }
//   }, 500), [availableMetrics]); // Re-run if availableMetrics change

//   // Trigger data fetches when queryParams change
//   useEffect(() => {
//     fetchReportData(queryParams);
//     fetchSummaryData(queryParams);
//   }, [queryParams, fetchReportData, fetchSummaryData]);

//   // --- Handlers for Filters and Table ---

//   const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
//     setQueryParams(prev => ({
//       ...prev,
//       startDate: dateStrings[0],
//       endDate: dateStrings[1],
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleMultiSelectChange = (field: keyof DashboardQueryParams) => (values: string[]) => {
//     setQueryParams(prev => ({
//       ...prev,
//       [field]: values,
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleSearch = (value: string) => {
//     setQueryParams(prev => ({
//       ...prev,
//       searchQuery: value || undefined, // Set to undefined if empty string
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
//     setQueryParams(prev => ({
//       ...prev,
//       [field]: values,
//       page: 1, // Reset to first page on filter change
//     }));
//   };

//   const handleTableChange = (
//     pagination: TablePaginationConfig,
//     filters: any,
//     sorter: any
//   ) => {
//     const newPage = Math.max(1, pagination.current || 1);
//     const newPageSize = Math.max(1, pagination.pageSize || 10000);

//     let newSortBy: string | undefined = undefined;
//     let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;

//     if (sorter && sorter.field) {
//       newSortBy = sorter.field.toString();
//       newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
//     }

//     setQueryParams(prev => ({
//       ...prev,
//       page: newPage,
//       pageSize: newPageSize,
//       sortBy: newSortBy,
//       sortOrder: newSortOrder,
//     }));
//   };

//   const handleExportCsv = () => {
//     // Use the current queryParams to export the filtered data
//     const exportRequest: ReportQueryRequest = {
//       ...queryParams,
//       size: totalRecords, // Export all records matching filters, not just current page
//       page: 1, // Ensure page is 1 for export all
//     };
//     exportReport(exportRequest);
//   };

//   // --- Dynamic Column Generation for Table ---
//   const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
//     if (data.length === 0) {
//       return [];
//     }

//     const allKeys = Object.keys(data[0]);

//     // Filter out 'id' if you don't want to display it
//     const displayKeys = allKeys.filter(key => key !== 'id');

//     // Create the base columns array
//     const baseColumns = displayKeys.map(key => ({
//       title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()), // Convert camelCase to Title Case
//       dataIndex: key,
//       key: key,
//       sorter: true, // Enable sorting for all columns
//       // You can add custom renderers for specific columns if needed
//       render: (text: any) => {
//         if (key === 'date') {
//           return dayjs(text).format('YYYY-MM-DD');
//         }
//         // Format numbers to 2 decimal places if they look like currency/rates
//         if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
//           return text.toFixed(2);
//         }
//         return text;
//       }
//     }));

//     // FIX: Add the "S.No." column at the beginning
//     const serialNumberColumn: ColumnsType<AdReportData>[0] = {
//       title: 'S.No.',
//       key: 'serialNumber',
//       width: 70, // Adjust width as needed
//       fixed: 'left', // Keep it fixed on the left when scrolling horizontally
//       render: (text, record, index) => (queryParams.page - 1) * queryParams.pageSize + index + 1,
//     };

//     return [serialNumberColumn, ...baseColumns]; // Prepend the serial number column
//   };

//   // FIX: Add queryParams.page and queryParams.pageSize to dependency array
//   const columns = React.useMemo(() => generateColumns(tableData), [tableData, queryParams.page, queryParams.pageSize]);


//   // --- Render ---
//   return (
//     <div style={{ padding: '20px' }}>
//       <Title level={2}>Ad Reporting Dashboard</Title>

//       {/* Summary Cards */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Requests" bordered={false}>
//             <Text strong>{summaryData.totalRequests.toLocaleString()}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Impressions" bordered={false}>
//             <Text strong>{summaryData.totalImpressions.toLocaleString()}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Clicks" bordered={false}>
//             <Text strong>{summaryData.totalClicks.toLocaleString()}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Total Payout" bordered={false}>
//             <Text strong>${summaryData.totalPayout.toFixed(2)}</Text>
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} md={6}>
//           <Card title="Average eCPM" bordered={false}>
//             <Text strong>${summaryData.averageEcpm.toFixed(2)}</Text>
//           </Card>
//         </Col>
//       </Row>

//       {/* Advanced Reporting Interface */}
//       <Card title="Report Filters & Builder" style={{ marginBottom: '20px' }}>
//         <Space direction="vertical" size="middle" style={{ width: '100%' }}>
//           {/* Date Range Filter */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Date Range:</Text></Col>
//             <Col span={18}>
//               <RangePicker
//                 value={[queryParams.startDate ? dayjs(queryParams.startDate) : null, queryParams.endDate ? dayjs(queryParams.endDate) : null]}
//                 onChange={handleDateRangeChange}
//                 style={{ width: '100%' }}
//                 format="YYYY-MM-DD"
//               />
//             </Col>
//           </Row>

//           {/* Dynamic Report Builder: Group By Dimensions */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Group By:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Select dimensions to group by"
//                 value={queryParams.groupByDimensions}
//                 onChange={handleDynamicSelectChange('groupByDimensions')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {availableDimensions.map(dim => (
//                   <Option key={dim} value={dim}>{dim.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Option>
//                 ))}
//               </Select>
//             </Col>
//           </Row>

//           {/* Dynamic Report Builder: Metrics */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Metrics:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Select metrics to display"
//                 value={queryParams.metrics}
//                 onChange={handleDynamicSelectChange('metrics')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {availableMetrics.map(metric => (
//                   <Option key={metric} value={metric}>{metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</Option>
//                 ))}
//               </Select>
//             </Col>
//           </Row>

//           {/* Multi-Select Filters */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>App Names:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by app names"
//                 value={queryParams.mobileAppNames}
//                 onChange={handleMultiSelectChange('mobileAppNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 {/* These options should ideally come from backend distinct values */}
//                 <Option value="Gangs Town Story: Grand Crime">Gangs Town Story: Grand Crime</Option>
//                 <Option value="Funny Supermarket game">Funny Supermarket game</Option>
//                 {/* ... add more options based on your data */}
//               </Select>
//             </Col>
//           </Row>
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Inventory Formats:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by inventory formats"
//                 value={queryParams.inventoryFormatNames}
//                 onChange={handleMultiSelectChange('inventoryFormatNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="Banner">Banner</Option>
//                 <Option value="Rewarded">Rewarded</Option>
//                 {/* ... add more options */}
//               </Select>
//             </Col>
//           </Row>
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>OS Versions:</Text></Col>
//             <Col span={18}>
//               <Select
//                 mode="multiple"
//                 placeholder="Filter by OS versions"
//                 value={queryParams.operatingSystemVersionNames}
//                 onChange={handleMultiSelectChange('operatingSystemVersionNames')}
//                 style={{ width: '100%' }}
//                 allowClear
//               >
//                 <Option value="iOS 15.3">iOS 15.3</Option>
//                 <Option value="iOS 16.7">iOS 16.7</Option>
//                 {/* ... add more options */}
//               </Select>
//             </Col>
//           </Row>

//           {/* Real-time Search */}
//           <Row gutter={16} align="middle">
//             <Col span={6}><Text strong>Search:</Text></Col>
//             <Col span={18}>
//               <Search
//                 placeholder="Search across fields"
//                 onSearch={handleSearch}
//                 onChange={(e) => handleSearch(e.target.value)} // Live search as user types
//                 style={{ width: '100%' }}
//                 allowClear
//               />
//             </Col>
//           </Row>

//           {/* Action Buttons */}
//           <Row gutter={16} style={{ marginTop: '20px' }}>
//             <Col span={12}>
//               <Button type="primary" onClick={handleExportCsv} block>
//                 Export Current Report CSV
//               </Button>
//             </Col>
//             {/* Save/Load Reports - Placeholder */}
//             <Col span={12}>
//               <Button onClick={() => message.info('Save/Load Report functionality coming soon!')} block>
//                 Save/Load Report (Future)
//               </Button>
//             </Col>
//           </Row>
//         </Space>
//       </Card>

//       {/* Data Table */}
//       <Card title="Report Data" style={{ marginBottom: '20px' }}>
//         <Spin spinning={loading}>
//           <Table
//             columns={columns}
//             dataSource={tableData}
//             rowKey="id" // Assuming 'id' is a unique key for each row
//             pagination={{
//               current: queryParams.page,
//               pageSize: queryParams.pageSize,
//               total: totalRecords,
//               showSizeChanger: true,
//               pageSizeOptions: ['10', '20', '50', '100', '1000', '10000'],
//               showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
//             }}
//             onChange={handleTableChange}
//             scroll={{ x: 'max-content' }} // Enable horizontal scrolling for many columns
//             bordered
//           />
//         </Spin>
//       </Card>
//     </div>
//   );
// }


// src/pages/DashboardPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Card, Row, Col, Space, Select, Input, DatePicker, Button, Spin, Table, message
} from 'antd';
import {
  getDimensions, getMetrics, queryReport, aggregateReport, exportReport,
  ReportQueryRequest, AdReportData
} from '../api';
import { debounce } from '../utils/debounce';
import dayjs from 'dayjs'; // Use dayjs for date handling
import type { RangePickerProps } from 'antd/lib/date-picker';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

// Define a type for the query parameters used in the frontend state
interface DashboardQueryParams {
  startDate?: string;
  endDate?: string;
  mobileAppNames?: string[];
  inventoryFormatNames?: string[];
  operatingSystemVersionNames?: string[];
  searchQuery?: string;
  groupByDimensions?: string[];
  metrics?: string[];
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Define a type for the aggregated summary data
interface SummaryMetrics {
  totalRequests: number;
  totalImpressions: number;
  totalClicks: number;
  totalPayout: number;
  averageEcpm: number;
}

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

  // State for report query parameters
  const [queryParams, setQueryParams] = useState<DashboardQueryParams>({
    groupByDimensions: [],
    metrics: [],
    page: 1,
    pageSize: 10000, // <--- CHANGED THIS TO 10000
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    mobileAppNames: [],
    inventoryFormatNames: [],
    operatingSystemVersionNames: [],
    searchQuery: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  });

  // --- API Calls ---

  // Function to fetch available dimensions and metrics
  useEffect(() => {
    getDimensions().then(res => setAvailableDimensions(res.data || [])).catch(err => console.error("Error fetching dimensions:", err));
    getMetrics().then(res => setAvailableMetrics(res.data || [])).catch(err => console.error("Error fetching metrics:", err));
  }, []);

  // Debounced function to fetch report data for the table
  const fetchReportData = useCallback(debounce(async (params: DashboardQueryParams) => {
    setLoading(true);
    try {
      // Map frontend queryParams to backend ReportQueryRequest
      const request: ReportQueryRequest = {
        ...params,
        size: params.pageSize, // Map pageSize to size for backend
      };
      const response = await queryReport(request);
      setTableData(response.data.content || []);
      setTotalRecords(response.data.totalElements || 0);
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

  // Debounced function to fetch aggregated summary data
  const fetchSummaryData = useCallback(debounce(async (params: DashboardQueryParams) => {
    try {
      const request: ReportQueryRequest = {
        startDate: params.startDate,
        endDate: params.endDate,
        mobileAppNames: params.mobileAppNames,
        inventoryFormatNames: params.inventoryFormatNames,
        operatingSystemVersionNames: params.operatingSystemVersionNames,
        searchQuery: params.searchQuery,
        metrics: availableMetrics, // Aggregate all available metrics for summary
        // No groupByDimensions, page, size for overall summary
      };
      const response = await aggregateReport(request);
      if (response.data && response.data.length > 0) {
        const aggregated = response.data[0]; // Assuming the first element is the overall aggregate
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
  }, 500), [availableMetrics]);

  // Trigger data fetches when queryParams change
  useEffect(() => {
    fetchReportData(queryParams);
    fetchSummaryData(queryParams);
  }, [queryParams, fetchReportData, fetchSummaryData]);

  // --- Handlers for Filters and Table ---

  const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
    setQueryParams(prev => ({
      ...prev,
      startDate: dateStrings[0],
      endDate: dateStrings[1],
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleMultiSelectChange = (field: keyof DashboardQueryParams) => (values: string[]) => {
    setQueryParams(prev => ({
      ...prev,
      [field]: values,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleSearch = (value: string) => {
    setQueryParams(prev => ({
      ...prev,
      searchQuery: value || undefined, // Set to undefined if empty string
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleDynamicSelectChange = (field: 'groupByDimensions' | 'metrics') => (values: string[]) => {
    setQueryParams(prev => ({
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
    const newPageSize = Math.max(1, pagination.pageSize || 10);

    let newSortBy: string | undefined = undefined;
    let newSortOrder: 'ASC' | 'DESC' | undefined = undefined;

    if (sorter && sorter.field) {
      newSortBy = sorter.field.toString();
      newSortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setQueryParams(prev => ({
      ...prev,
      page: newPage,
      pageSize: newPageSize,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    }));
  };

  const handleExportCsv = () => {
    // Use the current queryParams to export the filtered data
    const exportRequest: ReportQueryRequest = {
      ...queryParams,
      size: totalRecords, // Export all records matching filters, not just current page
      page: 1, // Ensure page is 1 for export all
    };
    exportReport(exportRequest);
  };

  // --- Dynamic Column Generation for Table ---
  const generateColumns = (data: AdReportData[]): ColumnsType<AdReportData> => {
    if (data.length === 0) {
      return [];
    }

    const allKeys = Object.keys(data[0]);

    // Filter out 'id' if you don't want to display it
    const displayKeys = allKeys.filter(key => key !== 'id');

    // Create the base columns array
    const baseColumns = displayKeys.map(key => ({
      title: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()), // Convert camelCase to Title Case
      dataIndex: key,
      key: key,
      sorter: true, // Enable sorting for all columns
      // You can add custom renderers for specific columns if needed
      render: (text: any) => {
        if (key === 'date') {
          return dayjs(text).format('YYYY-MM-DD');
        }
        // Format numbers to 2 decimal places if they look like currency/rates
        if (typeof text === 'number' && (key.toLowerCase().includes('ecpm') || key.toLowerCase().includes('payout') || key.toLowerCase().includes('ctr') || key.toLowerCase().includes('rate'))) {
          return text.toFixed(2);
        }
        return text;
      }
    }));

    // Add the "S.No." column at the beginning
    const serialNumberColumn: ColumnsType<AdReportData>[0] = {
      title: 'S.No.',
      key: 'serialNumber',
      width: 70, // Adjust width as needed
      fixed: 'left', // Keep it fixed on the left when scrolling horizontally
      render: (text, record, index) => (queryParams.page - 1) * queryParams.pageSize + index + 1,
    };

    return [serialNumberColumn, ...baseColumns]; // Prepend the serial number column
  };

  // Add queryParams.page and queryParams.pageSize to dependency array
  const columns = React.useMemo(() => generateColumns(tableData), [tableData, queryParams.page, queryParams.pageSize]);


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
                {/* ... add more options */}
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
            dataSource={tableData}
            rowKey="id"
            pagination={{
              current: queryParams.page,
              pageSize: queryParams.pageSize,
              total: totalRecords,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100', '1000', '10000'],
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