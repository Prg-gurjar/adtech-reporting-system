
import React, { useState } from 'react';
import { Upload, Button, message, Typography, Space, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { uploadCsvData } from '../api';
import type { RcFile, UploadFile, UploadFileStatus } from 'antd/lib/upload/interface';

const { Title, Text } = Typography;

export default function ImportPage() {
  // Use UploadFile type for a single file state
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);

  // Handler for the Upload button click
  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('Please select a CSV file to upload first.');
      return;
    }

    setUploading(true);
    try {
      // Make sure to pass the actual File object
      const response = await uploadCsvData(selectedFile.originFileObj as File);
      message.success(response);
      setSelectedFile(null); // Clear the file after successful upload
    } catch (error: any) {
      console.error('File upload failed:', error);
      message.error(error.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Props for Ant Design Upload component
  const uploadProps = {
    // When a file is added, Ant Design passes an UploadFile object
    onRemove: () => {
      setSelectedFile(null);
    },
    beforeUpload: (file: RcFile) => {
      // Update the state with the selected file, but prevent auto-upload
      setSelectedFile({
        uid: file.uid,
        name: file.name,
        status: 'done' as UploadFileStatus,
        originFileObj: file,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        lastModifiedDate: file.lastModifiedDate,
      });
      return false;
    },
    fileList: selectedFile ? [selectedFile] : [],
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

          <Upload {...uploadProps}>
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
        </Space>
      </Card>
    </div>
  );
}
