
import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import ImportPage from './pages/ImportPage';
import DashboardPage from './pages/DashboardPage';
import ReportBuilderPage from './pages/ReportBuilderPage'; 
import { Layout, Menu } from 'antd';
import { DashboardOutlined, UploadOutlined, LineChartOutlined } from '@ant-design/icons'; 
const { Header, Content } = Layout;

function App() {
  const location = useLocation();
  // Get the current URL location

  // Function to determine the currently selected menu key based on the URL path
  const getSelectedKey = () => {
    // Get the path without the leading slash (e.g., "/dashboard" becomes "dashboard")
    const pathKey = location.pathname.substring(1);

    // Handle the root path or default redirect if needed
    if (pathKey === '' || pathKey === '/') {
      return ['import']; // Default to 'import' if at the root URL
    }
    // Return an array with the key that matches the current path
    return [pathKey];
  };

  const selectedKeys = getSelectedKey(); 
  // Get the selected key(s)

  return (
    <Layout style={{ minHeight: '90vh' }}>
      <Header>
       
        {/* Ant Design Menu for navigation  */}
        <Menu 
          theme="dark" 
          mode="horizontal" 
          selectedKeys={selectedKeys} // Crucial: Use selectedKeys to highlight the active item
        >
          {/* Menu Item for Import CSV Page */}
          <Menu.Item key="import" icon={<UploadOutlined />}>
            <Link to="/import">Import CSV</Link> {/* Use Link for smooth client-side navigation */}
          </Menu.Item>

          {/* Menu Item for Dashboard Page */}
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            <Link to="/dashboard">Dashboard</Link> {/* Use Link for smooth client-side navigation */}
          </Menu.Item>

          
        </Menu>
      </Header>

      <Content style={{ padding: '24px' }}>
        {/* Define your application routes */}
        <Routes>
          <Route path="/import" element={<ImportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Redirect any unmatched paths to the /import page */}
          <Route path="*" element={<Navigate to="import" replace />} /> 
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;

