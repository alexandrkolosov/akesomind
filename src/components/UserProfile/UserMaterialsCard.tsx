import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Button from "../ui/button/Button";

interface MaterialFile {
  url: string;
  name: string;
}

interface Material {
  id: number;
  name: string;
  isAssigned: boolean;
  description: string;
  files: MaterialFile[];
  urls: string[];
}

interface MaterialAssignment {
  id: number;
  client: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    // Other client fields...
  };
  material: Material;
  createdAt: string;
}

interface UserData {
  id: number;
  role?: string;
  type?: string;
  userType?: string;
  isClient?: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  // Add other potential user data fields
}

interface UserMaterialsCardProps {
  clientId?: string;
}

// Mock data for materials since API endpoints are returning errors
// In production, this would be fetched from: https://api.akesomind.com/api/material/assigment
const MOCK_MATERIALS: MaterialAssignment[] = [
  {
    id: 1,
    client: {
      id: 1,
      firstName: "Test",
      lastName: "Client"
    },
    material: {
      id: 101,
      name: "Exercise: Managing Stress",
      isAssigned: true,
      description: "Daily exercises for managing stress and anxiety",
      files: [
        { 
          name: "stress_management.pdf", 
          url: "https://example.com/stress_management.pdf"
        }
      ],
      urls: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    client: {
      id: 2,
      firstName: "Jane",
      lastName: "Doe"
    },
    material: {
      id: 102,
      name: "Cognitive Behavioral Therapy Guide",
      isAssigned: true,
      description: "Introduction to CBT techniques",
      files: [
        { 
          name: "cbt_guide.pdf", 
          url: "https://example.com/cbt_guide.pdf"
        },
        {
          name: "practice_worksheet.pdf",
          url: "https://example.com/practice_worksheet.pdf"
        }
      ],
      urls: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    client: {
      id: 1,
      firstName: "Test",
      lastName: "Client"
    },
    material: {
      id: 103,
      name: "Meditation Resources",
      isAssigned: true,
      description: "Resources and guides for daily meditation practice",
      files: [],
      urls: ["https://example.com/meditation-guide", "https://example.com/mindfulness-practices"]
    },
    createdAt: new Date().toISOString()
  },
  // Adding materials for client ID 9 (therapist's own profile)
  {
    id: 4,
    client: {
      id: 9,
      firstName: "Therapist",
      lastName: "User"
    },
    material: {
      id: 201,
      name: "Therapist Resources: CBT Techniques",
      isAssigned: true,
      description: "Advanced cognitive behavioral therapy techniques for therapists",
      files: [
        { 
          name: "cbt_advanced_techniques.pdf", 
          url: "https://example.com/cbt_advanced_techniques.pdf"
        }
      ],
      urls: []
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    client: {
      id: 9,
      firstName: "Therapist",
      lastName: "User"
    },
    material: {
      id: 202,
      name: "Professional Development Resources",
      isAssigned: true,
      description: "Resources for continuing education and professional development",
      files: [
        { 
          name: "continuing_education.pdf", 
          url: "https://example.com/continuing_education.pdf"
        }
      ],
      urls: ["https://example.com/professional-resources"]
    },
    createdAt: new Date().toISOString()
  }
];

// Helper function to determine user role from data
function determineUserRole(data: any): string | undefined {
  if (!data) return undefined;
  
  // Direct check for known therapist role/type values without case sensitivity
  const isTherapistRole = 
    (data.role && String(data.role).toLowerCase() === 'therapist') || 
    (data.type && String(data.type).toLowerCase() === 'therapist') ||
    (data.userType && String(data.userType).toLowerCase() === 'therapist');
  
  if (isTherapistRole) return 'Therapist';
  
  // Direct check for known client role/type values without case sensitivity
  const isClientRole = 
    (data.role && String(data.role).toLowerCase() === 'client') || 
    (data.type && String(data.type).toLowerCase() === 'client') || 
    (data.userType && String(data.userType).toLowerCase() === 'client') ||
    data.isClient === true;
  
  if (isClientRole) return 'Client';
  
  // Fall back to existing values if present
  if (data.role) return data.role;
  if (data.type) return data.type;
  if (data.userType) return data.userType;
  
  return undefined;
}

// Utility function to determine if user is a client
const isUserClient = (data: UserData | null | undefined): boolean => {
  if (!data) return false;
  
  // First check direct properties that indicate client
  if (data.isClient === true) return true;
  
  // Check role/type fields for 'client' (case-insensitive)
  if (data.role && String(data.role).toLowerCase() === 'client') return true;
  if (data.type && String(data.type).toLowerCase() === 'client') return true;
  if (data.userType && String(data.userType).toLowerCase() === 'client') return true;
  
  // Use the determined role as fallback
  const role = determineUserRole(data);
  return role === 'Client';
};

// Utility function to determine if user is a therapist
const isUserTherapist = (data: UserData | null | undefined): boolean => {
  if (!data) return false;
  
  // Check role/type fields for 'therapist' (case-insensitive)
  if (data.role && String(data.role).toLowerCase() === 'therapist') return true;
  if (data.type && String(data.type).toLowerCase() === 'therapist') return true;
  if (data.userType && String(data.userType).toLowerCase() === 'therapist') return true;
  
  // Use the determined role as fallback
  const role = determineUserRole(data);
  return role === 'Therapist';
};

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'application/epub+zip'
];

// File extensions for validation
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpeg', '.jpg', '.epub'];

// Add a style tag for the highlight animation
const uploadFormHighlightStyle = `
  @keyframes highlightBorder {
    0% { border-color: #4f46e5; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
    50% { border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.4); }
    100% { border-color: #4f46e5; box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
  }
  
  .highlight-animation {
    animation: highlightBorder 1.5s ease-in-out;
    border-color: #4f46e5 !important;
  }
`;

export default function UserMaterialsCard({ clientId }: UserMaterialsCardProps) {
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debugging function - using useCallback to prevent recreation on each render
  const logMessage = useCallback((message: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message);
    }
  }, []);

  // Memoize fetch functions to prevent recreation on each render
  const fetchClientMaterials = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError("");
    logMessage(`CLIENT VIEW: Fetching materials for client ID: ${clientId}`);

    try {
      // Simulate API call with mock data
      setTimeout(() => {
        const clientIdNum = parseInt(clientId, 10);
        const clientMaterials = MOCK_MATERIALS.filter(
          assignment => assignment.client.id === clientIdNum
        );
        
        logMessage(`CLIENT VIEW: Found ${clientMaterials.length} materials for client ${clientId}`);
        setMaterials(clientMaterials);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching client materials:", error);
      setError("An error occurred while loading your materials.");
      setIsLoading(false);
    }
  }, [logMessage]);

  // Similar pattern for other fetch functions
  const fetchTherapistViewingClientMaterials = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError("");
    logMessage(`THERAPIST VIEW: Fetching materials for client ID: ${clientId}`);

    try {
      // Simulate API call with mock data
      setTimeout(() => {
        const clientIdNum = parseInt(clientId, 10);
        const clientMaterials = MOCK_MATERIALS.filter(
          assignment => assignment.client.id === clientIdNum
        );
        
        logMessage(`THERAPIST VIEW: Found ${clientMaterials.length} materials for client ${clientId}`);
        setMaterials(clientMaterials);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching client materials for therapist:", error);
      setError("An error occurred while loading client materials.");
      setIsLoading(false);
    }
  }, [logMessage]);

  const fetchAllMaterials = useCallback(async (therapistId?: string) => {
    setIsLoading(true);
    setError("");
    logMessage(`THERAPIST VIEW: Fetching all materials${therapistId ? ` for therapist ID: ${therapistId}` : ''}`);

    try {
      // Simulate API call with mock data
      setTimeout(() => {
        let filteredMaterials = MOCK_MATERIALS;
        
        // Filter by therapist ID if provided
        if (therapistId) {
          const therapistIdNum = parseInt(therapistId, 10);
          filteredMaterials = MOCK_MATERIALS.filter(
            assignment => assignment.client.id === therapistIdNum
          );
          logMessage(`THERAPIST VIEW: Filtered to ${filteredMaterials.length} materials for therapist ID ${therapistId}`);
        } else {
          logMessage(`THERAPIST VIEW: Showing all ${filteredMaterials.length} materials (no filtering)`);
        }
        
        setMaterials(filteredMaterials);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching therapist materials:", error);
      setError("An error occurred while loading materials.");
      setIsLoading(false);
    }
  }, [logMessage]);

  // First useEffect - Load user data from localStorage only once on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          
          if (parsedUserData) {
            setUserData(parsedUserData);
            
            // More detailed logging about roles
            logMessage(`User data from localStorage: Role=${parsedUserData.role}, Type=${parsedUserData.type}, UserType=${parsedUserData.userType}`);
            logMessage(`User ID: ${parsedUserData.id}, Email: ${parsedUserData.email || 'not set'}`);
            
            // Debug therapist detection
            const isTherapistUser = isUserTherapist(parsedUserData);
            logMessage(`Is user a therapist? ${isTherapistUser ? 'YES' : 'NO'}`);
          }
        } else {
          logMessage('No user data found in localStorage');
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    };

    logMessage(`UserMaterialsCard mounted with clientId: ${clientId || 'undefined'}`);
    loadUserData();
  }, [logMessage]); // Only run once on mount, include logMessage

  // Memoize user role calculations to prevent recalculation on every render
  const userRoles = useMemo(() => {
    if (!userData) return { isTherapist: false, isClient: false };
    return {
      isTherapist: isUserTherapist(userData) || 
                  (userData?.role?.toLowerCase() === 'therapist') || 
                  (userData?.type?.toLowerCase() === 'therapist') ||
                  (userData?.userType?.toLowerCase() === 'therapist'),
      isClient: isUserClient(userData) ||
               (userData?.role?.toLowerCase() === 'client') ||
               (userData?.type?.toLowerCase() === 'client') ||
               (userData?.userType?.toLowerCase() === 'client') ||
               (userData?.isClient === true)
    };
  }, [userData]);

  // Second useEffect - Handle materials loading based on user role and clientId
  useEffect(() => {
    if (!userData) return; // Don't proceed if userData isn't loaded yet
    
    const { isTherapist, isClient } = userRoles;
    
    // Determine if user is viewing their own profile
    let isViewingOwnProfile = false;
    if (userData && userData.id) {
      if (clientId) {
        isViewingOwnProfile = userData.id.toString() === clientId;
      } else {
        isViewingOwnProfile = isClient;
      }
    }
    
    logMessage(`User role: ${isClient ? 'Client' : isTherapist ? 'Therapist' : 'Unknown'}`);
    logMessage(`Is viewing own profile: ${isViewingOwnProfile}`);
    
    if (isClient && isViewingOwnProfile) {
      // Client viewing their own materials
      const clientUserId = userData?.id?.toString();
      if (clientUserId) {
        fetchClientMaterials(clientUserId);
      } else {
        setError("Unable to load materials: missing client ID");
      }
    } else if (isTherapist && clientId) {
      // Therapist viewing a specific client's materials
      fetchTherapistViewingClientMaterials(clientId);
    } else if (isTherapist && !clientId) {
      // Therapist viewing their own materials
      const therapistId = userData?.id?.toString();
      if (therapistId) {
        fetchAllMaterials(therapistId);
      } else {
        setError("Unable to load materials: missing therapist ID");
      }
    } else {
      setError("Unable to determine your role. Please refresh the page.");
    }
  }, [clientId, userData, userRoles, fetchClientMaterials, fetchTherapistViewingClientMaterials, fetchAllMaterials, logMessage]);

  // Function to simulate file downloads
  const handleDownload = (file: MaterialFile) => {
    if (!file.url) {
      logMessage(`Cannot download file - missing URL`);
      return;
    }
    
    logMessage(`Simulating download for file: ${file.name}`);
    
    // In a real app, this would handle actual file download
    // For now, just open the URL in a new tab
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.target = '_blank';
    a.click();
    
    logMessage(`Simulated download completed for ${file.name}`);
  };

  // Function to handle file upload for a client
  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!clientId) {
      setUploadError("Client ID is required for uploads");
      logMessage("ERROR: File upload attempted without client ID");
      return;
    }
    
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Please select a file to upload");
      logMessage("ERROR: No file selected for upload");
      return;
    }
    
    // Check file type
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
      setUploadError(`Unsupported file type. Please upload a PDF, DOC, DOCX, TXT, JPEG, JPG or EPUB file.`);
      logMessage(`ERROR: Invalid file type: ${file.type}, extension: ${fileExtension}`);
      return;
    }
    
    if (!materialName.trim()) {
      setUploadError("Please provide a name for the material");
      logMessage("ERROR: No material name provided");
      return;
    }
    
    setIsLoading(true);
    setUploadError("");
    
    try {
      logMessage(`Starting file upload process for client ID: ${clientId}`);
      logMessage(`File details - Name: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);
      
      // STEP 1: Upload file
      logMessage("STEP 1: Uploading file");
      
      // Simulate file upload success with a mock file ID
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      const fileId = `file_${Date.now()}`;
      logMessage(`File uploaded successfully. File ID: ${fileId}`);
      
      // Update progress for visual feedback
      setUploadProgress(50);
      
      // STEP 2: Create material
      logMessage("STEP 2: Creating material");
      
      // Simulate material creation with a mock ID
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      const materialId = `material_${Date.now()}`;
      logMessage(`Material created successfully. Material ID: ${materialId}`);
      
      // Update progress for visual feedback
      setUploadProgress(75);
      
      // STEP 3: Assign material to client
      logMessage(`STEP 3: Assigning material to client ID: ${clientId}`);
      
      // Simulate assignment success
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      logMessage(`Material assigned successfully to client ID: ${clientId}`);
      
      // Update progress for visual feedback
      setUploadProgress(100);
      
      // Reset form
      setMaterialName("");
      setMaterialDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Show success message
      setUploadSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
      
      // Refresh material list
      fetchTherapistViewingClientMaterials(clientId);
      
    } catch (error) {
      console.error("Error in upload process:", error);
      logMessage(`ERROR in upload process: ${error instanceof Error ? error.message : String(error)}`);
      setUploadError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openUrl = (url: string) => {
    console.log(`Opening URL: ${url}`);
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <style dangerouslySetInnerHTML={{ __html: uploadFormHighlightStyle }} />
      
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {userRoles.isTherapist 
            ? "Client Materials" 
            : "My Materials"}
        </h3>
        
        {/* Add Material Button for Therapists - Always visible when viewing client profile */}
        {clientId && (userRoles.isTherapist) && (
          <Button
            className="bg-primary hover:bg-primary-hover text-white flex items-center font-medium py-2 px-4 shadow-md hover:shadow-lg transition-all duration-300"
            onClick={() => {
              // Scroll to the upload form section
              const uploadForm = document.getElementById('upload-materials-form');
              if (uploadForm) {
                uploadForm.scrollIntoView({ behavior: 'smooth' });
                // Add highlight effect to make it more noticeable
                uploadForm.classList.add('highlight-animation');
                setTimeout(() => {
                  uploadForm.classList.remove('highlight-animation');
                }, 2000);
              } else {
                logMessage("Upload form element not found in DOM");
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Material
          </Button>
        )}
      </div>

      {/* File Upload Form for Therapists when viewing a client profile */}
      {clientId && (userRoles.isTherapist) && (
        <div id="upload-materials-form" className="mb-6 p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <h4 className="text-md font-medium mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload Material for Client
          </h4>
          
          <form onSubmit={handleFileUpload}>
            <div className="space-y-4">
              <div>
                <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  id="materialName"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="materialDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="materialDescription"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select File *
                </label>
                <input
                  type="file"
                  id="fileUpload"
                  ref={fileInputRef}
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-hover"
                  accept=".pdf,.doc,.docx,.txt,.jpeg,.jpg,.epub"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Allowed file types: {ALLOWED_FILE_EXTENSIONS.join(', ')}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  className="bg-primary hover:bg-primary-hover text-white"
                  disabled={isLoading}
                  onClick={() => {
                    if (fileInputRef.current && fileInputRef.current.form) {
                      fileInputRef.current.form.dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true })
                      );
                    }
                  }}
                >
                  {isLoading ? 'Uploading...' : 'Upload Material'}
                </Button>
              </div>
              
              {isLoading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-2 text-sm text-red-500">
                  {uploadError}
                </div>
              )}
              
              {uploadSuccess && (
                <div className="mt-2 text-sm text-green-500">
                  Material uploaded and assigned successfully!
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {!isLoading && !error && materials.length === 0 && (
        <div className="text-gray-500 py-4">
          No materials found.
          {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <details>
                <summary className="cursor-pointer">Debug Information</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {debugInfo.map((info, i) => (
                    <div key={i}>{info}</div>
                  ))}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && materials.length > 0 && (
        <div className="space-y-4">
          {materials.map((assignment) => {
            // Skip rendering if material is undefined
            if (!assignment.material) return null;
            
            return (
              <div key={assignment.id} className="border border-gray-100 rounded-lg p-4 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {assignment.material.name || 'Unnamed Material'}
                </h4>
                
                {/* Display assigned client name for therapists */}
                {userData && isUserTherapist(userData) && assignment.client && (
                  <p className="text-xs text-primary mb-2">
                    Assigned to: {assignment.client.firstName || ''} {assignment.client.lastName || ''}
                    {(!assignment.client.firstName && !assignment.client.lastName) && 
                      `Client #${assignment.client.id || 'Unknown'}`}
                  </p>
                )}
                
                {assignment.material.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {assignment.material.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {/* If material has files, show download buttons for each file */}
                  {assignment.material.files && assignment.material.files.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.material.files.map((file, index) => (
                          <Button
                            key={index}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-xs"
                            onClick={() => handleDownload(file)}
                          >
                            {file.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : assignment.material.urls && assignment.material.urls.length > 0 ? (
                    // If material has urls, show buttons to open each url
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Links:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.material.urls.map((url, index) => (
                          <Button
                            key={index}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-xs"
                            onClick={() => openUrl(url)}
                          >
                            Link {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // If material doesn't have files or URLs, show a message
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No downloadable content available for this material.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Debug information section - Only show in development environment */}
          {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <details>
                <summary className="cursor-pointer">Debug Information</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {debugInfo.map((info, i) => (
                    <div key={i}>{info}</div>
                  ))}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}