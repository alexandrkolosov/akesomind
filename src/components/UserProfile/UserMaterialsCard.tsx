import React, { useState, useEffect, useCallback, useMemo } from "react";
import Button from "../ui/button/Button";

interface MaterialFile {
  url: string;
  name: string;
  id?: number;
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

// Mock data for development and testing
// In production, this would be fetched from: https://api.akesomind.com/api/material
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
  
  // Check various properties that indicate client status
  return Boolean(
    data.isClient === true ||
    (data.role && String(data.role).toLowerCase() === 'client') ||
    (data.type && String(data.type).toLowerCase() === 'client') ||
    (data.userType && String(data.userType).toLowerCase() === 'client')
  );
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

// Material Card Component for rendering a single material
const MaterialCard = ({ assignment, onDownload, onOpenUrl }: { 
  assignment: MaterialAssignment, 
  onDownload: (fileId: number, fileName: string) => void,
  onOpenUrl: (url: string) => void
}) => {
  // Skip rendering if material is undefined
  if (!assignment.material) return null;
  
  const material = assignment.material;
  
  return (
    <div className="border border-gray-100 rounded-lg p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
        {material.name || 'Unnamed Material'}
        {material.id && (
          <span className="text-xs text-gray-500 ml-2">ID: {material.id}</span>
        )}
      </h4>
      
      {/* Display assigned client name for therapists */}
      {assignment.client && (
        <p className="text-xs text-primary mb-2">
          Assigned to: {assignment.client.firstName || ''} {assignment.client.lastName || ''}
          {(!assignment.client.firstName && !assignment.client.lastName) && 
            `Client #${assignment.client.id || 'Unknown'}`}
        </p>
      )}
      
      {material.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {material.description}
        </p>
      )}
      
      <div className="space-y-2">
        {/* If material has files, show download buttons for each file */}
        {material.files && material.files.length > 0 ? (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Files:</p>
            <div className="flex flex-wrap gap-2">
              {material.files.map((file, index) => (
                file.id !== undefined && (
                  <button
                    key={index}
                    className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-blue-400 text-xs"
                    onClick={() => onDownload(file.id as number, file.name)}
                  >
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {file.name}
                  </button>
                )
              ))}
            </div>
          </div>
        ) : material.urls && material.urls.length > 0 ? (
          // If material has urls, show buttons to open each url
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Links:</p>
            <div className="flex flex-wrap gap-2">
              {material.urls.map((url, index) => (
                <button
                  key={index}
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-xs"
                  onClick={() => onOpenUrl(url)}
                >
                  <svg 
                    className="w-4 h-4 mr-1" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
                  </svg>
                  {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                </button>
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
};

export default function UserMaterialsCard({ clientId }: UserMaterialsCardProps) {
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const logMessage = (message: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`UserMaterialsCard: ${message}`);
    }
  };

  // Memoize fetch functions to prevent recreation on each render
  const fetchClientMaterials = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError("");
    logMessage(`CLIENT VIEW: Fetching materials for client ID: ${clientId}`);

    try {
      // Since the API is not available, fall back to mock data
      logMessage(`NOTE: API endpoint not available. Would have called: GET https://api.akesomind.com/api/material`);
      logMessage('Using mock data for development');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const clientIdNum = parseInt(clientId, 10);
      const clientMaterials = MOCK_MATERIALS.filter(
        assignment => assignment.client.id === clientIdNum
      );
      
      logMessage(`CLIENT VIEW: Found ${clientMaterials.length} mock materials for client ${clientId}`);
      setMaterials(clientMaterials);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching client materials:", error);
      logMessage(`ERROR fetching client materials: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while loading your materials.");
      setIsLoading(false);
    }
  }, [logMessage]);

  // Similar pattern for therapist viewing client materials
  const fetchTherapistViewingClientMaterials = useCallback(async (clientId: string) => {
    setIsLoading(true);
    setError("");
    logMessage(`THERAPIST VIEW: Fetching materials for client ID: ${clientId}`);

    try {
      // Since the API is not available, fall back to mock data
      logMessage(`NOTE: API endpoint not available. Would have called: GET https://api.akesomind.com/api/material`);
      logMessage('Using mock data for development');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const clientIdNum = parseInt(clientId, 10);
      const clientMaterials = MOCK_MATERIALS.filter(
        assignment => assignment.client.id === clientIdNum
      );
      
      logMessage(`THERAPIST VIEW: Found ${clientMaterials.length} mock materials for client ${clientId}`);
      setMaterials(clientMaterials);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching client materials for therapist:", error);
      logMessage(`ERROR fetching client materials for therapist: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while loading client materials.");
      setIsLoading(false);
    }
  }, [logMessage]);

  const fetchAllMaterials = useCallback(async (therapistId?: string) => {
    setIsLoading(true);
    setError("");
    logMessage(`THERAPIST VIEW: Fetching all materials${therapistId ? ` for therapist ID: ${therapistId}` : ''}`);

    try {
      // Since the API is not available, fall back to mock data
      logMessage(`NOTE: API endpoint not available. Would have called: GET https://api.akesomind.com/api/material`);
      logMessage('Using mock data for development');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredMaterials = MOCK_MATERIALS;
      
      // Filter by therapist ID if provided
      if (therapistId) {
        const therapistIdNum = parseInt(therapistId, 10);
        filteredMaterials = MOCK_MATERIALS.filter(
          assignment => assignment.client.id === therapistIdNum
        );
        logMessage(`THERAPIST VIEW: Filtered to ${filteredMaterials.length} mock materials for therapist ID ${therapistId}`);
      } else {
        logMessage(`THERAPIST VIEW: Showing all ${filteredMaterials.length} mock materials`);
      }
      
      setMaterials(filteredMaterials);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching therapist materials:", error);
      logMessage(`ERROR fetching therapist materials: ${error instanceof Error ? error.message : String(error)}`);
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

  // Keep the memoized userRoles
  const userRoles = useMemo(() => {
    if (!userData) return { isTherapist: false, isClient: false, isTherapistViewingClient: false };
    return {
      isTherapist: isUserTherapist(userData) || 
                  (userData?.role?.toLowerCase() === 'therapist') || 
                  (userData?.type?.toLowerCase() === 'therapist') ||
                  (userData?.userType?.toLowerCase() === 'therapist'),
      isClient: isUserClient(userData) ||
               (userData?.role?.toLowerCase() === 'client') ||
               (userData?.type?.toLowerCase() === 'client') ||
               (userData?.userType?.toLowerCase() === 'client') ||
               (userData?.isClient === true),
      isTherapistViewingClient: clientId !== undefined && isUserTherapist(userData)
    };
  }, [userData, clientId]);

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

  // Function to handle file downloads
  const handleDownload = (fileId: number, fileName: string) => {
    if (!fileId) {
      logMessage(`Cannot download file - missing file ID`);
      return;
    }
    
    // Create a direct download link to the file
    const downloadUrl = `https://api.akesomind.com/api/material/file/${fileId}`;
    logMessage(`Downloading file: ${fileName} from ${downloadUrl}`);
    
    // Create and click a download link
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || `file-${fileId}`;
    a.target = '_self'; // Use _self to ensure it works well with credentials
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    logMessage(`File download initiated for ${fileName}`);
  };

  const openUrl = (url: string) => {
    console.log(`Opening URL: ${url}`);
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
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
          {materials.map((assignment) => (
            <MaterialCard 
              key={assignment.id} 
              assignment={assignment} 
              onDownload={handleDownload}
              onOpenUrl={openUrl}
            />
          ))}
          
          {/* Debug information section - Only show in development environment */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <details>
                <summary className="cursor-pointer font-medium">Debug Information</summary>
                <div className="mt-2 overflow-auto max-h-60">
                  <div className="mb-2">
                    <span className="font-medium">User Role:</span> {userRoles.isTherapist ? 'Therapist' : userRoles.isClient ? 'Client' : 'Unknown'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Client ID:</span> {clientId || 'Not viewing a client'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Logs:</span>
                  </div>
                  <pre className="whitespace-pre-wrap bg-gray-200 dark:bg-gray-700 p-2 rounded">
                    {debugInfo.map((info, i) => (
                      <div key={i} className={info.includes('ERROR') ? 'text-red-500' : info.includes('WARN') ? 'text-yellow-500' : ''}>
                        {info}
                      </div>
                    ))}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}