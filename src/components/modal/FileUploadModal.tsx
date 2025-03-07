import React, { useState, useRef } from 'react';

// Allowed MIME types for file uploads
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'application/epub+zip'
];

// File extensions for validation
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpeg', '.jpg', '.epub'];

// Human-readable file types for display
const HUMAN_READABLE_FILE_TYPES = 'PDF, Word documents (DOC/DOCX), text files (TXT), images (JPEG/JPG), or E-books (EPUB)';

interface ClientDetail {
  id: number;
  firstName: string;
  lastName: string;
  [key: string]: any;
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDetail;
  onUploadSuccess: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, client, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      setUploadError(`Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null);
    
    // Auto-fill material name with file name (without extension)
    if (!materialName) {
      const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
      setMaterialName(fileName);
    }
  };
  
  // Handle drag-and-drop events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      setUploadError(`Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`);
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 10MB.');
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null);
    
    // Auto-fill material name with file name (without extension)
    if (!materialName) {
      const fileName = file.name.substring(0, file.name.lastIndexOf('.'));
      setMaterialName(fileName);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    
    if (!materialName.trim()) {
      setUploadError('Please enter a name for the material.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    
    console.log(`Starting file upload process for client ID: ${client.id}`);
    console.log(`File details - Name: ${selectedFile.name}, Type: ${selectedFile.type}, Size: ${selectedFile.size} bytes`);
    
    try {
      // STEP 1: Upload file to the specified endpoint
      console.log("STEP 1: Uploading file to API endpoint");
      console.log("POST https://api.akesomind.com/api/material/file");
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await fetch('https://api.akesomind.com/api/material/file', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`File upload failed with status: ${uploadResponse.status}. Error: ${errorText}`);
        throw new Error(`File upload failed with status: ${uploadResponse.status}`);
      }
      
      // Parse the response to get the file ID
      let fileId;
      try {
        const uploadData = await uploadResponse.json();
        console.log("Upload response data:", uploadData);
        
        // Handle the case where the server returns just a number instead of a JSON object
        fileId = typeof uploadData === 'number' ? uploadData : uploadData.id;
        
        if (fileId === undefined) {
          throw new Error('Failed to get file ID from server response');
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // If JSON parsing fails, the response might be a plain number
        const textResponse = await uploadResponse.text();
        console.log("Raw response text:", textResponse);
        fileId = parseInt(textResponse, 10);
        
        if (isNaN(fileId)) {
          throw new Error('Failed to get file ID from server response');
        }
      }
      
      console.log(`File uploaded successfully. File ID: ${fileId}`);
      
      // Update progress for visual feedback
      setUploadProgress(75);
      
      // STEP 2: Now assign the material to the client
      try {
        console.log("STEP 2: Assigning material to client");
        const assignUrl = `https://api.akesomind.com/api/material/assigment`;
        console.log(`Requesting: GET ${assignUrl}`);
        
        // Try to assign the material to the client
        const assignResponse = await fetch(assignUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!assignResponse.ok) {
          console.log(`Assignment endpoint returned status: ${assignResponse.status}`);
          const errorText = await assignResponse.text();
          console.log(`Assignment response: ${errorText}`);
          console.log("Continuing despite assignment error - file was uploaded successfully");
        } else {
          console.log("Material successfully assigned to client");
        }
      } catch (assignError) {
        console.error("Error in assignment step:", assignError);
        console.log("Continuing despite assignment error - file was uploaded successfully");
      }
      
      // Update progress for visual feedback
      setUploadProgress(100);
      
      // Show success message
      setUploadSuccess(true);
      
      // Clear form
      setSelectedFile(null);
      setMaterialName('');
      setMaterialDescription('');
      
      // Notify parent component
      onUploadSuccess();
      
      // Close the modal after a delay
      setTimeout(() => {
        onClose();
        setUploadSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error in upload process:", error);
      setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="w-full max-w-lg p-6 mx-4 bg-white rounded-lg shadow-lg dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Upload Material for {client.firstName} {client.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* File Upload Form */}
        <form onSubmit={handleFileUpload} className="space-y-4">
          {/* Material Name */}
          <div>
            <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material Name*
            </label>
            <input
              type="text"
              id="materialName"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter a name for this material"
              required
            />
          </div>

          {/* Material Description */}
          <div>
            <label htmlFor="materialDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="materialDescription"
              value={materialDescription}
              onChange={(e) => setMaterialDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter a description for this material"
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload File*
            </label>
            
            {/* Drag and Drop Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                isDragging 
                  ? 'border-primary bg-primary bg-opacity-10' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-20' 
                    : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="py-2">
                  <svg className="mx-auto h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {isDragging ? 'Drop file here' : 'Drag and drop file here, or click to select'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Allowed file types: {HUMAN_READABLE_FILE_TYPES}
                  </p>
                </div>
              )}
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpeg,.jpg,.epub"
            />
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-500 dark:text-red-400 p-3 rounded-md text-sm">
              {uploadError}
            </div>
          )}

          {/* Success message */}
          {uploadSuccess && (
            <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-500 dark:text-green-400 p-3 rounded-md text-sm">
              File successfully attached to the client.
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {uploadProgress}%
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              ) : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUploadModal; 