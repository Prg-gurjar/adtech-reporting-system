// import React, { useState } from 'react';
// import { Typography, Button, message } from 'antd';
// import CsvUploader from '../components/CsvUploader';
// import StatusTracker from '../components/StatusTracker';
// import { uploadCsv, fetchImportStatus } from '../api';

// export default function ImportPage() {
//   const [jobId, setJobId] = useState<string | null>(null);
//   const [progress, setProgress] = useState(0);
//   const [status, setStatus] = useState('idle');
//    const [uploadProgress, setUploadProgress] = useState(0); 

//   // const handleFile = async (file: File) => {
//   //   setStatus('uploading');
//   //   try {
//   //     const resp = await uploadCsv(file);
//   //     setJobId(resp.data.jobId);
//   //     setStatus('processing');
//   //     pollStatus(resp.data.jobId);
//   //   } catch {
//   //     message.error('Upload failed');
//   //     setStatus('idle');
//   //   }
//   // };
//   const handleFileUpload = async (file: File) => {
//     try {
//       // Pass the setUploadProgress function to uploadCsv
//       const response = await uploadCsv(file, setUploadProgress);
//       console.log('Upload successful!', response.data);
//       // Reset progress after upload
//       setUploadProgress(0);
//     } catch (error) {
//       console.error('Upload failed!', error);
//       setUploadProgress(0); // Reset on error too
//     }
//   };

//   const pollStatus = (id: string) => {
//     const interval = setInterval(async () => {
//       const resp = await fetchImportStatus(id);
//       setProgress(resp.data.progress);
//       if (resp.data.status === 'done') {
//         clearInterval(interval);
//         setStatus('done');
//         message.success('Import complete');
//       }
//     }, 1000);
//   };

//   return (
//     <div>
//       <Typography.Title level={2}>CSV Import</Typography.Title>
//       <CsvUploader onFileSelected={handleFileUpload} />
//       <StatusTracker status={status} progress={progress} />
//       {status === 'done' && (
//         <Button type="primary" onClick={() => window.location.replace('/dashboard')}>
//           Go to Dashboard
//         </Button>
//       )}
//     </div>
//   );
// }


// src/pages/ImportPage.tsx

// import React, { useState } from 'react';
// import { Button, Upload, message, Progress } from 'antd'; // Make sure Progress is imported
// import { UploadOutlined } from '@ant-design/icons';
// import { uploadCsv, fetchImportStatus } from '../api';

// export default function ImportPage() {
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [jobId, setJobId] = useState<number | null>(null); // State to store jobId
//   const [status, setStatus] = useState<string>(''); // State to store status
//   const [progress, setProgress] = useState<number | undefined>(undefined); // State for progress

//   // Function to poll import status
//   const pollStatus = (id: number) => { // CHANGED: id type to number
//     const interval = setInterval(async () => {
//       try {
//         const resp = await fetchImportStatus(id); // Use the number id
//         setProgress(resp.data.progress); // Access progress from resp.data
//         setStatus(resp.data.status);

//         if (resp.data.status === 'done' || resp.data.status === 'failed') { // Added 'failed' status check
//           clearInterval(interval);
//           message.success(`Import job ${id} ${resp.data.status}!`);
//         }
//       } catch (error) {
//         console.error(`Error polling status for job ${id}:`, error);
//         clearInterval(interval);
//         message.error(`Failed to get status for job ${id}.`);
//         setStatus('failed');
//       }
//     }, 2000); // Poll every 2 seconds
//   };

//   const handleUpload = async (options: any) => {
//     const { file } = options;
//     try {
//       message.info('Starting upload...');
//       const response = await uploadCsv(file, setUploadProgress);
//       setJobId(response.data.jobId);
//       message.success(`File uploaded successfully! Job ID: ${response.data.jobId}`);
//       pollStatus(response.data.jobId); // Start polling with the numeric jobId
//     } catch (error) {
//       console.error("Upload failed:", error);
//       message.error('File upload failed.');
//     }
//   };

//   return (
//     <div>
//       <Button
//         type="primary"
//         icon={<UploadOutlined />}
//         onClick={() => { /* This button typically triggers the upload component */ }}
//       >
//         Upload CSV
//       </Button>
//       <Upload customRequest={handleUpload} showUploadList={false}>
//         <Button icon={<UploadOutlined />}>Select File</Button>
//       </Upload>
//       {uploadProgress > 0 && uploadProgress < 100 && (
//         <Progress percent={uploadProgress} />
//       )}
//       {jobId !== null && (
//         <div>
//           <p>Job ID: {jobId}</p>
//           <p>Status: {status}</p>
//           {progress !== undefined && <Progress percent={progress} />}
//         </div>
//       )}
//     </div>
//   );
// }


// src/pages/ImportPage.tsx


// src/pages/ImportPage.tsx

// import React, { useState } from 'react';
// import { Button, Upload, message, Progress } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { uploadCsv, fetchImportStatus } from '../api';

// export default function ImportPage() {
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [jobId, setJobId] = useState<number | null>(null);
//   const [status, setStatus] = useState<string>('');
//   const [progress, setProgress] = useState<number | undefined>(undefined); // progress can be undefined initially

//   // Fix: id parameter must be of type number
//   const pollStatus = (id: number) => {
//     const interval = setInterval(async () => {
//       try {
//         const resp = await fetchImportStatus(id); // Pass the number id
//         // Fix: Access progress from resp.data, which is of type ImportStatusResponse
//         setProgress(resp.data.progress);
//         setStatus(resp.data.status);

//         if (resp.data.status === 'done' || resp.data.status === 'failed') {
//           clearInterval(interval);
//           message.success(`Import job ${id} ${resp.data.status}!`);
//         }
//       } catch (error) {
//         console.error(`Error polling status for job ${id}:`, error);
//         clearInterval(interval);
//         message.error(`Failed to get status for job ${id}.`);
//         setStatus('failed');
//       }
//     }, 2000);
//   };

//   const handleUpload = async (options: any) => {
//     const { file } = options;
//     try {
//       message.info('Starting upload...');
//       const response = await uploadCsv(file, setUploadProgress);
//       setJobId(response.data.jobId);
//       message.success(`File uploaded successfully! Job ID: ${response.data.jobId}`);
//       pollStatus(response.data.jobId); // Pass the numeric jobId here
//     } catch (error) {
//       console.error("Upload failed:", error);
//       message.error('File upload failed.');
//     }
//   };

//   return (
//     <div>
//       <Button
//         type="primary"
//         icon={<UploadOutlined />}
//         onClick={() => { /* This button typically triggers the upload component */ }}
//       >
//         Upload CSV
//       </Button>
//       <Upload customRequest={handleUpload} showUploadList={false}>
//         <Button icon={<UploadOutlined />}>Select File</Button>
//       </Upload>
//       {uploadProgress > 0 && uploadProgress < 100 && (
//         <Progress percent={uploadProgress} />
//       )}
//       {jobId !== null && (
//         <div>
//           <p>Job ID: {jobId}</p>
//           <p>Status: {status}</p>
//           {progress !== undefined && <Progress percent={progress} />}
//         </div>
//       )}
//     </div>
//   );
// }

// src/pages/ImportPage.tsx

// import React, { useState } from 'react';
// import { Button, Upload, message, Progress } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { uploadCsv, fetchImportStatus } from '../api';

// export default function ImportPage() {
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [jobId, setJobId] = useState<number | null>(null);
//   const [status, setStatus] = useState<string>('');
//   const [progress, setProgress] = useState<number | undefined>(undefined);

//   const pollStatus = (id: number) => { // Fix: id parameter must be of type number
//     const interval = setInterval(async () => {
//       try {
//         const resp = await fetchImportStatus(id);
//         setProgress(resp.data.progress); // Fix: Access progress from resp.data
//         setStatus(resp.data.status);

//         if (resp.data.status === 'done' || resp.data.status === 'failed') {
//           clearInterval(interval);
//           message.success(`Import job ${id} ${resp.data.status}!`);
//         }
//       } catch (error) {
//         console.error(`Error polling status for job ${id}:`, error);
//         clearInterval(interval);
//         message.error(`Failed to get status for job ${id}.`);
//         setStatus('failed');
//       }
//     }, 2000);
//   };

//   const handleUpload = async (options: any) => {
//     const { file } = options;
//     try {
//       message.info('Starting upload...');
//       const response = await uploadCsv(file, setUploadProgress);
//       setJobId(response.data.jobId);
//       message.success(`File uploaded successfully! Job ID: ${response.data.jobId}`);
//       pollStatus(response.data.jobId);
//     } catch (error) {
//       console.error("Upload failed:", error);
//       message.error('File upload failed.');
//     }
//   };

//   return (
//     <div>
//       <Button
//         type="primary"
//         icon={<UploadOutlined />}
//         onClick={() => { /* This button typically triggers the upload component */ }}
//       >
//         Upload CSV
//       </Button>
//       <Upload customRequest={handleUpload} showUploadList={false}>
//         <Button icon={<UploadOutlined />}>Select File</Button>
//       </Upload>
//       {uploadProgress > 0 && uploadProgress < 100 && (
//         <Progress percent={uploadProgress} />
//       )}
//       {jobId !== null && (
//         <div>
//           <p>Job ID: {jobId}</p>
//           <p>Status: {status}</p>
//           {progress !== undefined && <Progress percent={progress} />}
//         </div>
//       )}
//     </div>
//   );
// }

// import React, { useState, useRef } from 'react';
// import { Button, Upload, message, Progress } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
// import { uploadCsv, fetchImportStatus } from '../api'; // Assuming these functions exist
// import { UploadRequestOption } from 'rc-upload/lib/interface';
 


// export default function ImportPage() {
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [jobId, setJobId] = useState<number | null>(null);
//   const [status, setStatus] = useState<string>('');
//   const [progress, setProgress] = useState<number | undefined>(undefined);
//   const [showFileUpload, setShowFileUpload] = useState<boolean>(false); // New state to control visibility
//   const [selectedFile, setSelectedFile] = useState<File | null>(null); 
   
//   // Ref to the hidden file input element inside Ant Design Upload
//   const uploadRef = useRef<any>(null); // Use 'any' or more specific type if Ant Design provides it for Upload instance


//   const pollStatus = (id: number) => {
//     const interval = setInterval(async () => {
//       try {
//         // Ensure id is a number before passing to fetchImportStatus
//         if (typeof id !== 'number') {
//           console.error('Invalid job ID for polling:', id);
//           clearInterval(interval);
//           message.error('Invalid job ID. Polling stopped.');
//           return;
//         }

//         const resp = await fetchImportStatus(id) ;;
//         // Assuming resp.data has 'progress' and 'status' properties
//         // If resp.data is directly the status object, adjust accordingly
//         setProgress(resp.data.progress);
//         setStatus(resp.data.status);

//         if (resp.data.status === 'COMPLETED' || resp.data.status === 'FAILED') { // Use constants for clarity, e.g., 'COMPLETED', 'FAILED' from backend
//           clearInterval(interval);
//           message.success(`Import job ${id} ${resp.data.status.toLowerCase()}!`);
//           setShowFileUpload(false); // Hide the file selection module after completion
//         }
//       } catch (error) {
//         console.error(`Error polling status for job ${id}:`, error);
//         clearInterval(interval);
//         message.error(`Failed to get status for job ${id}.`);
//         setStatus('FAILED'); // Indicate a failed status
//         setShowFileUpload(false); // Hide the file selection module on polling error
//       }
//     }, 2000);
//   };

//   // Removed duplicate handleUpload definition to fix redeclaration error.

//   // State to control if the "Select File" button itself is loading during the upload process
//   const [loading, setLoading] = useState<boolean>(false); // Add a loading state for the button

//   const props = {
//     name: 'file', // Name of the parameter sent to the server
//     multiple: false,
//     showUploadList: false, // Crucial: Hide the default upload list and its trigger button
//     accept: '.csv',
//     customRequest: handleUpload, // Use your custom upload logic
//     beforeUpload: (file: File) => {
//       const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
//       if (!isCsv) {
//         message.error(`${file.name} is not a CSV file!`);
//       }
//       const isLt2M = file.size / 1024 / 1024 < 20; // Example: limit to 20MB
//       if (!isLt2M) {
//         message.error('File must be smaller than 20MB!');
//       }
//       return isCsv && isLt2M;
//     },
//     onChange(info: any) {
//       // This onChange is primarily for internal Ant Design state,
//       // but you can use it to react to upload events if customRequest isn't enough.
//       // We are managing progress and status via pollStatus and setUploadProgress from customRequest.
//     },
//   };

//    const handleInitialUploadClick = ()=>{
//     setShowFileUpload(true); // Show the file selection module
//     setUploadProgress(0); // Reset any previous progress
//     setJobId(null);       // Reset job ID
//     setStatus('');        // Reset status
//     setProgress(undefined); // Reset polling progress
//   };

//   const handleUpload = async (options: any) => {
//     const { file } = options;
//     try {
//       message.info('Starting upload...');
//       const response = await uploadCsv(file, setUploadProgress);
//       setJobId(response.data.jobId);
//       message.success(`File uploaded successfully! Job ID: ${response.data.jobId}`);
//       pollStatus(response.data.jobId);
//     } catch (error) {
//       console.error("Upload failed:", error);
//       message.error('File upload failed.');
//     }
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
//       <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Import Ad Report Data</h1>

//       {/* Initial "Upload CSV" button - visible until clicked */}
//       {!showFileUpload && (
//         <Button
//           type="primary"
//           icon={<UploadOutlined />}
//           size="large"
//           style={{ width: '100%', marginBottom: '20px' }}
//           onClick={handleInitialUploadClick}
//         >
//           Upload CSV
//         </Button>
//       )}

//       {/* File selection module - visible only after "Upload CSV" is clicked */}
//       {showFileUpload && (
//         <div style={{ border: '1px dashed #d9d9d9', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fafafa' }}>
//           <p style={{ marginBottom: '15px', textAlign: 'center', fontSize: '16px' }}>
//             Click "Select File" to choose your CSV:
//           </p>
//           <Upload customRequest={handleUpload} showUploadList={false}>
//           <Button icon={<UploadOutlined />}>Select File</Button>
//        </Upload>

//           {/* Display Ant Design's upload progress during file selection/preparation */}
//           {selectedFile && uploadProgress > 0 && uploadProgress < 100 && (
//             <Progress percent={uploadProgress} style={{ marginTop: '15px' }} />
//           )}

//           {/* Optionally show selected file name here if not using default Antd list */}
//           {selectedFile && !jobId && (
//             <p style={{ marginTop: '10px', color: '#52c41a' }}>Selected: {selectedFile.name}</p>
//           )}

//           {/* Cancel Button */}
//           <Button
//             type="default"
//             danger
//             style={{ marginTop: '15px', width: '100%' }}
//             onClick={() => setShowFileUpload(false)} // Hide the file selection module
//             disabled={loading} // Disable if an upload is in progress
//           >
//             Cancel
//           </Button>
//         </div>
//       )}

//       {/* Display job status and polling progress */}
//       {jobId !== null && (
//         <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#e6f7ff' }}>
//           <h3 style={{ marginTop: 0 }}>Import Job Status:</h3>
//           <p><strong>Job ID:</strong> {jobId}</p>
//           <p><strong>Overall Status:</strong> {status}</p>
//           {progress !== undefined && progress < 100 && status !== 'COMPLETED' && status !== 'FAILED' && (
//             <Progress percent={progress} status={status === 'IN_PROGRESS' ? 'active' : 'normal'} />
//           )}
//           {progress === 100 && status === 'COMPLETED' && (
//               <Progress percent={100} status="success" />
//           )}
//           {status === 'FAILED' && (
//               <Progress percent={progress || 0} status="exception" />
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState } from 'react';
import { Button, Upload, message, Progress } from 'antd'; // Make sure all these are imported from 'antd'
import { UploadOutlined } from '@ant-design/icons';
import { uploadCsv, fetchImportStatus } from '../api'; // Assuming these functions exist

// It's good practice to define types for your API responses if possible
interface UploadResponse {
  jobId: number;
  // Add other properties if your API returns them
}

interface ImportStatusResponse {
  progress: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'; // Define possible statuses
}

export default function ImportPage() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>(''); // General status for display
  const [progress, setProgress] = useState<number | undefined>(undefined); // Progress from polling
  const [showFileUpload, setShowFileUpload] = useState<boolean>(false); // Controls visibility of file selection
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Stores the file selected by the user
  const [loading, setLoading] = useState<boolean>(false); // Controls loading state of "Select File" button

  // Function to poll the import job status from the backend
  const pollStatus = (id: number) => {
    const interval = setInterval(async () => {
      try {
        if (typeof id !== 'number') {
          console.error('Invalid job ID for polling:', id);
          clearInterval(interval);
          message.error('Invalid job ID. Polling stopped.');
          return;
        }

        const resp = await fetchImportStatus(id) as { data: ImportStatusResponse }; // Type assertion
        setProgress(resp.data.progress);
        setStatus(resp.data.status);

        if (resp.data.status === 'COMPLETED' || resp.data.status === 'FAILED') {
          clearInterval(interval);
          message.success(`Import job ${id} ${resp.data.status.toLowerCase()}!`);
          setShowFileUpload(false); // Hide file selection after job completes/fails
          setLoading(false); // Turn off loading
          setSelectedFile(null); // Clear selected file
        }
      } catch (error) {
        console.error(`Error polling status for job ${id}:`, error);
        clearInterval(interval);
        message.error(`Failed to get status for job ${id}.`);
        setStatus('FAILED');
        setShowFileUpload(false);
        setLoading(false); // Turn off loading on error
        setSelectedFile(null); // Clear selected file
      }
    }, 2000);
  };

  // Function to handle the file upload triggered by Ant Design's Upload component
  // THIS MUST BE DECLARED BEFORE 'props' if it's referenced in 'props'
  const handleUpload = async (options: { file: File }) => {
    const { file } = options;
    
    // Immediately set the selected file for display in the UI
    setSelectedFile(file); 

    try {
      setLoading(true); // Start loading indicator
      setUploadProgress(0); // Reset upload progress for the new file
      message.info('Starting file upload...');
      
      const response = await uploadCsv(file, (percent: number) => {
        setUploadProgress(percent); // Update progress for the file upload itself
      }) as { data: UploadResponse }; // Type assertion for upload response

      const newJobId = response.data.jobId;
      setJobId(newJobId);
      message.success(`File uploaded successfully! Job ID: ${newJobId}. Now processing...`);

      // Start polling for the import job's status
      pollStatus(newJobId);

    } catch (error) {
      console.error("File upload failed:", error);
      message.error('File upload failed. Please check console for details.');
      setUploadProgress(0); // Reset progress on failure
      setStatus('FAILED'); // Indicate overall failure
      setLoading(false); // Stop loading
      setSelectedFile(null); // Clear selected file on failure
    }
    // Crucial: Return false to prevent Ant Design's default upload behavior,
    // as we are handling the upload with `customRequest`.
    return false;
  };

  // Props for the Ant Design Upload component
  const uploadProps = { // Renamed to uploadProps to avoid confusion with component props
    name: 'file', // The name of the field that will contain the file in the form data
    multiple: false, // Only allow single file upload
    showUploadList: false, // Hide the default Ant Design upload file list
    accept: '.csv', // Only accept CSV files
    customRequest: handleUpload, // Use our custom upload function
    beforeUpload: (file: File) => {
      // Client-side validation before upload starts
      const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
      if (!isCsv) {
        message.error(`${file.name} is not a CSV file!`);
      }
      const isLt20M = file.size / 1024 / 1024 < 20; // Example: limit file size to 20MB
      if (!isLt20M) {
        message.error('File must be smaller than 20MB!');
      }
      // Return true to proceed with upload, false to cancel
      return isCsv && isLt20M;
    },
    // onChange can be used for more detailed file status handling within Ant Design's lifecycle,
    // but with customRequest, much of it is managed manually.
    // onChange(info: UploadChangeParam) {
    //   // You might log info.file.status here for debugging if needed
    // }
  };

  // Function to handle the click on the initial "Upload CSV" button
  const handleInitialUploadClick = () => {
    setShowFileUpload(true); // Show the file selection module
    // Reset all relevant states for a fresh upload experience
    setUploadProgress(0);
    setJobId(null);
    setStatus('');
    setProgress(undefined);
    setSelectedFile(null);
    setLoading(false); // Ensure loading is off when beginning a new selection
  };

  // Function to handle the cancel action within the file selection module
  const handleCancelUpload = () => {
    setShowFileUpload(false); // Hide the file selection module
    // Reset all states when cancelling
    setSelectedFile(null);
    setUploadProgress(0);
    setJobId(null);
    setStatus('');
    setProgress(undefined);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Import Ad Report Data</h1>

      {/* Initial "Upload CSV" button: Visible until clicked */}
      {!showFileUpload && (
        <Button
          type="primary"
          icon={<UploadOutlined />}
          size="large"
          style={{ width: '100%', marginBottom: '10px'}}
          onClick={handleInitialUploadClick}
        >
          Upload CSV
        </Button>
      )}

      {/* File selection module: Visible only after "Upload CSV" is clicked */}
      {showFileUpload && (
        <div style={{ border: '1px dashed #d9d9d9', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fafafa' }}>
          <p style={{ marginBottom: '15px', textAlign: 'center', fontSize: '16px' }}>
            Click "Select File" to choose your CSV:
          </p>
          {/* Ant Design Upload component - uses uploadProps */}
          <Upload>
            <Button icon={<UploadOutlined />} loading={loading} style={{ width: '100%' }}>
              Select File
            </Button>
          </Upload>

          {/* Display file upload progress (from the client to the server) */}
          {selectedFile && uploadProgress > 0 && uploadProgress < 100 && (
            <Progress percent={uploadProgress} style={{ marginTop: '15px' }} />
          )}

          {/* Optionally show selected file name here */}
          {selectedFile && !jobId && ( // Show selected file name before job ID is assigned
            <p style={{ marginTop: '10px', color: '#52c41a' }}>Selected: {selectedFile.name}</p>
          )}

          {/* Cancel Button for the file selection module */}
          <Button
            type="default"
            danger
            style={{ marginTop: '15px', width: '100%' }} // Removed invalid 'mt' property
            onClick={handleCancelUpload}
            disabled={loading} // Disable if an upload is in progress
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Display import job status and polling progress */}
      {jobId !== null && (
        <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', backgroundColor: '#e6f7ff' }}>
          <h3 style={{ marginTop: 0 }}>Import Job Status:</h3>
          <p><strong>Job ID:</strong> {jobId}</p>
          <p><strong>Overall Status:</strong> {status}</p>
          {/* Progress for the backend import job */}
          {progress !== undefined && progress < 100 && status !== 'COMPLETED' && status !== 'FAILED' && (
            <Progress percent={progress} status={status === 'IN_PROGRESS' ? 'active' : 'normal'} />
          )}
          {progress === 100 && status === 'COMPLETED' && (
              <Progress percent={100} status="success" />
          )}
          {status === 'FAILED' && (
              <Progress percent={progress || 0} status="exception" />
          )}
        </div>
      )}
    </div>
  );
}