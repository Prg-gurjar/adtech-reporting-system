import React from 'react';
import { Table, Spin } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

// Define the props interface for your custom DataTable component
export interface DataTableProps<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  columns: ColumnsType<T>;
  onChange: (pagination: TablePaginationConfig, filters: any, sorter: any) => void;
  // FIX: Add pageSizeOptions to the props interface
  pageSizeOptions?: string[]; // Make it optional, as it might not always be provided
  // FIX: Add showTotal to the props interface, with correct Ant Design signature
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
}

// Custom DataTable component
function DataTable<T extends object>({
  data,
  total,
  page,
  pageSize,
  loading,
  columns,
  onChange,
  pageSizeOptions, // Destructure the new prop
  showTotal, // Destructure the new prop
}: DataTableProps<T>) {
  return (
    <Spin spinning={loading}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id" // Assuming 'id' is a common unique key for your data
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          // FIX: Pass the new props to Ant Design's Table pagination
          pageSizeOptions: pageSizeOptions,
          showTotal: showTotal,
        }}
        onChange={onChange}
        scroll={{ x: 'max-content' }} // Enable horizontal scrolling for many columns
        bordered
      />
    </Spin>
  );
}

export default DataTable;
