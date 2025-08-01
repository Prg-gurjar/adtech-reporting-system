import React from 'react';
import { Table, Spin } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';

// Define the props interface for your custom DataTable component
export interface DataTableProps<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  columns: ColumnsType<T>;
  // FIX: Use correct Ant Design signature for onChange handler
  onChange: (pagination: TablePaginationConfig, filters: any, sorter: SorterResult<T> | SorterResult<T>[]) => void;
  pageSizeOptions?: string[];
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
  pageSizeOptions,
  showTotal,
}: DataTableProps<T>) {
  return (
    <Spin spinning={loading}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: pageSizeOptions,
          showTotal: showTotal,
        }}
        onChange={onChange}
        scroll={{ x: 'max-content' }}
        bordered
      />
    </Spin>
  );
}

export default DataTable;
