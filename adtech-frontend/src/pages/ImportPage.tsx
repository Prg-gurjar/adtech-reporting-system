import React, { useState } from 'react';
import { Upload, Button, message, Typography, Space, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadCsvData } from '../api'; 
// We still import UploadFile and UploadFileStatus for clarity,
// but the 'any' cast will bypass strict checking for fileList.
import type { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface';

const { Title, Text } = Typography;

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const [uploading, setUploading] = useState(false); 
  // Handler for when a file is selected in the Ant Design Upload component
  const handleFileChange = (info: any) => {
    if (info.fileList && info.fileList.length > 0) {
      setSelectedFile(info.fileList[0].originFileObj); 
    } else {
      setSelectedFile(null);
    }
  };

  // Handler for the Upload button click
  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('Please select a CSV file to upload first.');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadCsvData(selectedFile);
      message.success(response);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('File upload failed:', error);
      message.error(error.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Props for Ant Design Upload component
  const uploadProps = {
    beforeUpload: (file: File) => {
      setSelectedFile(file);
      return false; 
    },
    onRemove: () => {
      setSelectedFile(null); 
    },
    // FIX: Cast the entire fileList array to 'any' as a last resort to bypass the TypeScript error.
    // This allows compilation but reduces type safety for this specific prop.
    fileList: selectedFile ? [{
      uid: selectedFile.name,
      name: selectedFile.name,
      status: 'done' as UploadFileStatus,
      originFileObj: selectedFile,
      url: '',
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    }] as any : [], 
    accept: '.csv',
    maxCount: 1,
    title: "Select CSV file for upload",
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Import Ad Report Data</Title>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text>
            Upload your CSV file containing ad report data. Ensure the CSV format matches the expected schema.
          </Text>

          <Upload {...uploadProps} onChange={handleFileChange}>
            <Button icon={<UploadOutlined />} disabled={uploading}>
              Select CSV File
            </Button>
          </Upload>

          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            loading={uploading}
            style={{ width: '100%' }}
          >
            {uploading ? 'Uploading...' : 'Upload Data'}
          </Button>

          {selectedFile && (
            <Text type="secondary">Selected file: {selectedFile.name}</Text>
          )}
        </Space>
      </Card>
    </div>
  );
}
