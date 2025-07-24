// import React from 'react';
// import { Table } from 'antd';

// export default function DataTable({
//   data,
//   total,
//   page,
//   pageSize,
//   onChange,
// }: {
//   data: any[];
//   total: number;
//   page: number;
//   pageSize: number;
//   onChange: (p: Partial<{ page: number; pageSize: number }>) => void;
// }) {
//   const columns = Object.keys(data[0] || {}).map((key) => ({
//     title: key,
//     dataIndex: key,
//     sorter: true,
//   }));

//   return (
//     <Table
//       columns={columns}
//       dataSource={data}
//       rowKey="id"
//       pagination={{
//         current: page,
//         pageSize,
//         total,
//         showSizeChanger: true,
//       }}
//       onChange={(p) =>
//         onChange({ page: p.current || 1, pageSize: p.pageSize || pageSize })
//       }
//       scroll={{ y: 400 }}
//     />
//   );
// }
// import React from 'react';
// import { Table } from 'antd';
// import type { TablePaginationConfig, TableProps } from 'antd'; // Import Ant Design Table types

// // Define the type for the columns prop that will be passed from the parent
// type ColumnsType<T> = TableProps<T>['columns'];

// // Define the type for the onChange prop that matches Ant Design's Table onChange
// // This ensures all parameters (pagination, filters, sorter) are passed through
// type TableChangeCallback<T> = NonNullable<TableProps<T>['onChange']>;

// interface DataTableProps<T> {
//   data: T[]; // Generic type T for data
//   total: number;
//   page: number;
//   pageSize: number;
//   loading?: boolean; // Add loading prop
//   columns: ColumnsType<T>; // Now accepts columns as a prop
//   onChange: TableChangeCallback<T>; // Matches Ant Design's onChange signature
// }

// export default function DataTable<T extends object>({ // Use generic type T, constrained to object
//   data,
//   total,
//   page,
//   pageSize,
//   loading = false, // Default loading to false
//   columns, // Receive columns as a prop
//   onChange, // Receive the full onChange callback
// }: DataTableProps<T>) {

//   // Remove the internal columns generation logic.
//   // Columns will now be passed in from the parent component (e.g., DashboardPage.tsx).
//   // const columns = Object.keys(data[0] || {}).map((key) => ({
//   //   title: key,
//   //   dataIndex: key,
//   //   sorter: true,
//   // }));

//   return (
//     <Table<T> // Specify generic type for Table
//       columns={columns} // Use the columns passed as prop
//       dataSource={data}
//       rowKey="id" // Assuming 'id' is always present and unique in your data T
//       loading={loading} // Pass the loading prop
//       pagination={{
//         current: page,
//         pageSize,
//         total,
//         showSizeChanger: true,
//         pageSizeOptions: ['10', '20', '50', '100'], // Add common page size options
//         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`, // Show total text
//       }}
//       // Pass the full onChange callback directly to Ant Design's Table
//       onChange={onChange}
//       scroll={{ x: 'max-content' }} // Enable horizontal scrolling for many columns
//       bordered // Add borders for better visual separation
//     />
//   );
// }


// src/components/DataTable.tsx

import React from 'react';
import { Table } from 'antd';
import type { TablePaginationConfig, TableProps } from 'antd'; // Import Ant Design Table types

// Define the type for the columns prop that will be passed from the parent
type ColumnsType<T> = TableProps<T>['columns'];

// Define the type for the onChange prop that matches Ant Design's Table onChange
// This ensures all parameters (pagination, filters, sorter) are passed through
type TableChangeCallback<T> = NonNullable<TableProps<T>['onChange']>;

interface DataTableProps<T> {
  data: T[]; // Generic type T for data
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean; // Add loading prop
  columns: ColumnsType<T>; // Now accepts columns as a prop
  onChange: TableChangeCallback<T>; // Matches Ant Design's onChange signature
}

// CRITICAL FIX: Declare DataTable as a generic component <T extends object>
export default function DataTable<T extends object>({ // Use generic type T, constrained to object
  data,
  total,
  page,
  pageSize,
  loading = false, // Default loading to false
  columns, // Receive columns as a prop
  onChange, // Receive the full onChange callback
}: DataTableProps<T>) {

  return (
    <Table<T> // Specify generic type for Table
      columns={columns} // Use the columns passed as prop
      dataSource={data}
      rowKey="id" // Assuming 'id' is always present and unique in your data T
      loading={loading} // Pass the loading prop
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'], // Add common page size options
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`, // Show total text
      }}
      // Pass the full onChange callback directly to Ant Design's Table
      onChange={onChange}
      scroll={{ x: 'max-content' }} // Enable horizontal scrolling for many columns
      bordered // Add borders for better visual separation
    />
  );
}