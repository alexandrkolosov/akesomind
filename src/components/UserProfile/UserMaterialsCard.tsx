import React, { useState, useEffect } from "react";
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

export default function UserMaterialsCard({ clientId }: UserMaterialsCardProps) {
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Debugging function
  const addDebugInfo = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, message]);
  };

  // Function to determine if user is a client
  const isUserClient = (data: UserData): boolean => {
    return data.role === "client" || 
           data.userType === "client" || 
           data.isClient === true ||
           data.type === "Client" ||  // Add check for "type" field with capital "C"
           // Check any other potential client identifiers in the user data
           false;
  };

  // Initialize component and load user data if needed
  useEffect(() => {
    addDebugInfo(`UserMaterialsCard mounted with clientId: ${clientId || 'undefined'}`);
    
    // First try to get user data from localStorage
    let cachedUserData: UserData | null = null;
    
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        cachedUserData = JSON.parse(userDataStr);
        addDebugInfo(`Retrieved user data from localStorage: ${JSON.stringify(cachedUserData)}`);
        setUserData(cachedUserData);
      } else {
        addDebugInfo('No user data found in localStorage');
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      addDebugInfo(`Error parsing user data: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    const isTherapist = cachedUserData?.type === 'Therapist' || cachedUserData?.role === 'Therapist';
    const isClient = cachedUserData ? isUserClient(cachedUserData) : false;
    
    // Check if user is viewing their own profile
    const isViewingOwnProfile = clientId && cachedUserData?.id?.toString() === clientId;
    addDebugInfo(`Is viewing own profile: ${isViewingOwnProfile}`);
    
    if (isClient) {
      // CLIENT LOGIC: Client viewing their own materials
      const clientId = cachedUserData?.id?.toString();
      addDebugInfo(`Client user detected. Fetching assigned materials for client ID: ${clientId}`);
      fetchClientMaterials(clientId);
    } else if (isTherapist && clientId && !isViewingOwnProfile) {
      // THERAPIST LOGIC: Therapist viewing a specific client's materials (not their own)
      addDebugInfo(`Therapist viewing client with ID: ${clientId}`);
      fetchTherapistViewingClientMaterials(clientId);
    } else if (isTherapist) {
      // THERAPIST LOGIC: Therapist viewing all materials (including their own profile)
      addDebugInfo(`Therapist viewing their own profile or all materials`);
      fetchAllMaterials(); // Use a simpler material fetching approach for therapist's own profile
    } else {
      addDebugInfo('Could not determine user role or missing clientId');
      setError("Unable to determine your role. Please refresh the page.");
    }
  }, [clientId]);

  // CLIENT LOGIC: Function to fetch materials assigned to a client
  const fetchClientMaterials = async (clientId?: string) => {
    if (!clientId) {
      addDebugInfo('No client ID available');
      setError("Unable to load materials: missing client ID");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError("");
    addDebugInfo(`CLIENT VIEW: Fetching materials assigned to client ID: ${clientId}`);

    try {
      // Use the correct endpoint with misspelling as specified
      const response = await fetch(
        `https://api.akesomind.com/api/material/assigment`, 
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const materialsList = data.list || [];
        addDebugInfo(`CLIENT VIEW: Received ${materialsList.length} total materials from /api/material/assigment`);
        
        // Filter materials to show only those assigned to this client
        const clientMaterials = materialsList.filter((assignment: MaterialAssignment) => {
          // Check if the assignment has client information
          if (assignment.client && assignment.client.id) {
            return assignment.client.id.toString() === clientId;
          }
          // Check for clientId property that might be present in some API responses
          else if ((assignment as any).clientId) {
            return (assignment as any).clientId.toString() === clientId;
          }
          return false;
        });
        
        addDebugInfo(`CLIENT VIEW: Filtered to ${clientMaterials.length} materials for client ${clientId}`);
        setMaterials(clientMaterials);
      } else {
        addDebugInfo(`CLIENT VIEW: Failed to fetch from /api/material/assigment - Status: ${response.status}`);
        setError("Failed to load your materials. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching client materials:", error);
      addDebugInfo(`CLIENT VIEW: Error: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while loading your materials.");
    } finally {
      setIsLoading(false);
    }
  };

  // THERAPIST LOGIC: Function for therapist viewing a specific client's materials
  const fetchTherapistViewingClientMaterials = async (clientId: string) => {
    setIsLoading(true);
    setError("");
    addDebugInfo(`THERAPIST VIEW: Fetching materials for client ID: ${clientId}`);

    try {
      // Therapist-specific endpoints for viewing a client's materials
      const therapistEndpoints = [
        `https://api.akesomind.com/api/therapist/client/${clientId}/materials`,
        `https://api.akesomind.com/api/material/assignments?clientId=${clientId}`,
        `https://api.akesomind.com/api/material/assignment?clientId=${clientId}`
      ];
      
      let response = null;
      let successEndpoint = '';
      
      for (const endpoint of therapistEndpoints) {
        addDebugInfo(`THERAPIST VIEW: Trying endpoint: ${endpoint}`);
        try {
          const tempResponse = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            }
          });
          
          if (tempResponse.ok) {
            response = tempResponse;
            successEndpoint = endpoint;
            addDebugInfo(`THERAPIST VIEW: Successfully fetched data from endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          addDebugInfo(`THERAPIST VIEW: Error trying endpoint ${endpoint}: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        addDebugInfo(`THERAPIST VIEW: Received ${data.list ? data.list.length : 0} materials from ${successEndpoint}`);
        setMaterials(data.list || []);
      } else {
        addDebugInfo(`THERAPIST VIEW: Failed to fetch from all therapist endpoints for client`);
        
        // Fallback to all materials and filter client-side
        addDebugInfo(`THERAPIST VIEW: Falling back to all materials endpoint and filtering for client ${clientId}`);
        await fetchAllTherapistMaterials(clientId);
      }
    } catch (error) {
      console.error("Error fetching client materials for therapist:", error);
      addDebugInfo(`THERAPIST VIEW: Error: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while loading client materials.");
      setIsLoading(false);
    }
  };

  // THERAPIST LOGIC: Function for therapist viewing all materials
  const fetchAllTherapistMaterials = async (filterClientId?: string) => {
    if (!isLoading) setIsLoading(true);
    if (error) setError("");
    addDebugInfo(`THERAPIST VIEW: Fetching all therapist materials${filterClientId ? ` (filtering for client ${filterClientId})` : ''}`);

    try {
      // Therapist-specific endpoints for viewing all materials
      const therapistEndpoints = [
        `https://api.akesomind.com/api/therapist/materials`,
        `https://api.akesomind.com/api/material/assignments`,
        `https://api.akesomind.com/api/material/assignment`,
        // Add new fallback endpoint that should work for all therapists
        `https://api.akesomind.com/api/material/assignment/all`,
        `https://api.akesomind.com/api/material/all`
      ];
      
      let response = null;
      let successEndpoint = '';
      
      for (const endpoint of therapistEndpoints) {
        addDebugInfo(`THERAPIST VIEW: Trying endpoint: ${endpoint}`);
        try {
          const tempResponse = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            }
          });
          
          if (tempResponse.ok) {
            response = tempResponse;
            successEndpoint = endpoint;
            addDebugInfo(`THERAPIST VIEW: Successfully fetched data from endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          addDebugInfo(`THERAPIST VIEW: Error trying endpoint ${endpoint}: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        let materialsList = data.list || [];
        addDebugInfo(`THERAPIST VIEW: Received ${materialsList.length} total materials from ${successEndpoint}`);
        
        // Filter by client ID if requested
        if (filterClientId && materialsList.length > 0) {
          const filteredMaterials = materialsList.filter((assignment: MaterialAssignment) => {
            // Check if the assignment has client information
            if (assignment.client && assignment.client.id) {
              return assignment.client.id.toString() === filterClientId;
            }
            // Check for clientId property that might be present in some API responses
            else if ((assignment as any).clientId) {
              return (assignment as any).clientId.toString() === filterClientId;
            }
            return false;
          });
          
          addDebugInfo(`THERAPIST VIEW: Filtered ${materialsList.length} materials to ${filteredMaterials.length} materials for client ${filterClientId}`);
          setMaterials(filteredMaterials);
        } else {
          setMaterials(materialsList);
        }
      } else {
        // Last resort - try the original API endpoint from the initial implementation
        addDebugInfo(`THERAPIST VIEW: Failed to fetch from all therapist endpoints, trying original endpoint as last resort`);
        
        try {
          const lastResortResponse = await fetch(
            `https://api.akesomind.com/api/material/assignment`, 
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store',
                'Pragma': 'no-cache'
              }
            }
          );
          
          if (lastResortResponse.ok) {
            const data = await lastResortResponse.json();
            let materialsList = data.list || [];
            addDebugInfo(`THERAPIST VIEW: LAST RESORT: Received ${materialsList.length} materials from original endpoint`);
            
            // Filter by client ID if requested
            if (filterClientId && materialsList.length > 0) {
              const filteredMaterials = materialsList.filter((assignment: MaterialAssignment) => {
                return assignment.client?.id?.toString() === filterClientId;
              });
              
              addDebugInfo(`THERAPIST VIEW: LAST RESORT: Filtered to ${filteredMaterials.length} materials for client ${filterClientId}`);
              setMaterials(filteredMaterials);
            } else {
              setMaterials(materialsList);
            }
          } else {
            addDebugInfo(`THERAPIST VIEW: All endpoints failed`);
            setError("Failed to load materials. Please try again later.");
          }
        } catch (lastError) {
          addDebugInfo(`THERAPIST VIEW: Last resort fetch failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
          setError("Failed to load materials. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error fetching therapist materials:", error);
      addDebugInfo(`THERAPIST VIEW: Error: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while loading materials.");
    } finally {
      setIsLoading(false);
    }
  };

  // New simplified function for fetching all materials (used for therapist viewing own profile)
  const fetchAllMaterials = async () => {
    setIsLoading(true);
    setError("");
    addDebugInfo(`THERAPIST VIEW: Fetching all materials for therapist's own profile`);

    try {
      // Use the correct endpoint with the misspelling as specified
      const response = await fetch(
        `https://api.akesomind.com/api/material/assigment`, 
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`THERAPIST VIEW: Received ${data.list ? data.list.length : 0} materials from /api/material/assigment`);
        setMaterials(data.list || []);
      } else {
        addDebugInfo(`THERAPIST VIEW: Failed to fetch from /api/material/assigment - Status: ${response.status}`);
        setError("Failed to load materials. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching all materials:", error);
      addDebugInfo(`THERAPIST VIEW: Error: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while loading materials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to download material file directly
  const downloadMaterialFile = async (fileId: number, fileName: string): Promise<void> => {
    addDebugInfo(`Directly downloading file ID: ${fileId}, filename: ${fileName}`);
    
    // Special case for Beck Assessment (BDI-II)
    if (fileName.includes("Beck") || fileName === "BDI21.pdf") {
      addDebugInfo("Special handling for Beck Assessment - always using fileId 42");
      fileId = 42; // Override fileId for Beck Assessment
    }
    
    try {
      // Use the exact endpoint specified: /api/material/file/{id}
      const fileUrl = `https://api.akesomind.com/api/material/file/${fileId}`;
      addDebugInfo(`Making request to endpoint: ${fileUrl}`);
      
      const response = await fetch(fileUrl, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf, application/octet-stream',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      addDebugInfo(`Blob received: ${blob.size} bytes, type: ${blob.type}`);
      
      // Create a download link and trigger it
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      addDebugInfo(`Download completed for ${fileName}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      addDebugInfo(`Error downloading file: ${error instanceof Error ? error.message : String(error)}`);
      
      // If direct download fails, try opening in a new tab using the same endpoint
      const fileUrl = `https://api.akesomind.com/api/material/file/${fileId}`;
      addDebugInfo(`Attempted download failed. Opening in new tab: ${fileUrl}`);
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        {userData && (userData.type === 'Therapist' || userData.role === 'Therapist') 
          ? "Therapists materials" 
          : "My Materials"}
      </h3>

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
          {debugInfo.length > 0 && (
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
            // Skip rendering if material is undefined or doesn't have required fields
            if (!assignment || !assignment.material) {
              addDebugInfo(`Skipping assignment with ID ${assignment?.id || 'unknown'} due to missing material data`);
              return null;
            }
            
            // SECURITY SAFEGUARD: Final check to ensure clients only see their assigned materials
            // This is a double-check in case filtering logic has issues
            if (userData && 
                (userData.type === 'Client' || userData.role === 'client' || userData.isClient) && 
                clientId && 
                assignment.client?.id !== parseInt(clientId, 10) && 
                (assignment as any).clientId !== parseInt(clientId, 10)) {
              addDebugInfo(`SECURITY: Prevented rendering material ${assignment?.id} - client ID mismatch`);
              return null;
            }
            
            return (
              <div key={assignment.id || 'unknown'} className="border border-gray-100 rounded-lg p-4 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {assignment.material?.name || 'Unnamed Material'}
                </h4>
                
                {/* Display assigned client name for therapists */}
                {userData && (userData.type === 'Therapist' || userData.role === 'Therapist') && assignment.client && (
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
                  {assignment.material.files && Array.isArray(assignment.material.files) && assignment.material.files.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.material.files.map((file, index) => {
                          // Skip if file doesn't have required properties
                          if (!file || typeof file !== 'object') return null;
                          
                          return (
                            <Button
                              key={index}
                              className="bg-primary hover:bg-primary-hover text-white text-xs"
                              onClick={() => {
                                addDebugInfo(`Clicked download for material ID: ${assignment.material?.id}, name: ${assignment.material?.name}`);
                                addDebugInfo(`File name: ${file.name || 'unknown'}, url: ${file.url || 'unknown'}`);
                                
                                // Check if we have the required data
                                if (!file.url && !file.name) {
                                  addDebugInfo(`Cannot download file - missing url and name`);
                                  alert("Cannot download file - missing required information");
                                  return;
                                }
                                
                                // Get the file ID from the URL if available
                                let fileId: number | null = null;
                                try {
                                  // Try to extract fileId from URL pattern like "/api/material/file/42"
                                  if (file.url) {
                                    const urlMatch = file.url.match(/\/api\/material\/file\/(\d+)/);
                                    if (urlMatch && urlMatch[1]) {
                                      fileId = parseInt(urlMatch[1], 10);
                                      addDebugInfo(`Extracted fileId from URL: ${fileId}`);
                                    }
                                  }
                                } catch (error) {
                                  addDebugInfo(`Failed to extract fileId from URL: ${error instanceof Error ? error.message : String(error)}`);
                                }
                                
                                // Handle Beck Assessment (BDI-II)
                                // This has a specific file ID (42) regardless of the material ID
                                if ((assignment.material?.name && assignment.material.name.includes("Beck")) || 
                                    (file.name && file.name.includes("BDI")) || 
                                    assignment.material?.id === 44) {
                                  addDebugInfo("Special handling for Beck Assessment detected");
                                  downloadMaterialFile(42, file.name || "BDI21.pdf");
                                  return;
                                }
                                
                                // If we have a fileId, use direct file download method
                                else if (fileId) {
                                  addDebugInfo(`Using direct file download with ID: ${fileId}`);
                                  downloadMaterialFile(fileId, file.name || 'file.pdf');
                                }
                                // Otherwise fall back to original URL fetch method
                                else if (file.url) {
                                  addDebugInfo(`Falling back to URL fetch method: ${file.url}`);
                                  // Try to download the file using the fetch API
                                  fetch(file.url, { credentials: 'include' })
                                    .then(response => {
                                      addDebugInfo(`Download response status: ${response.status}`);
                                      if (!response.ok) {
                                        throw new Error(`HTTP error! Status: ${response.status}`);
                                      }
                                      return response.blob();
                                    })
                                    .then(blob => {
                                      // Create a blob URL and trigger download
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.style.display = 'none';
                                      a.href = url;
                                      a.download = file.name || 'file.pdf';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      window.URL.revokeObjectURL(url);
                                      addDebugInfo(`Download completed for ${file.name || 'file.pdf'}`);
                                    })
                                    .catch(error => {
                                      console.error("Error downloading file:", error);
                                      addDebugInfo(`Error downloading file: ${error instanceof Error ? error.message : String(error)}`);
                                      alert("Failed to download file using URL. Trying direct file download instead.");
                                      
                                      // Try getting the file ID from the URL if it follows a pattern
                                      try {
                                        if (file.url) {
                                          const pathParts = new URL(file.url).pathname.split('/');
                                          const potentialFileId = parseInt(pathParts[pathParts.length - 1], 10);
                                          if (!isNaN(potentialFileId)) {
                                            addDebugInfo(`Extracted potential fileId from URL path: ${potentialFileId}`);
                                            downloadMaterialFile(potentialFileId, file.name || 'file.pdf');
                                          } else if (assignment.material?.id) {
                                            // As a last resort, try with the material ID
                                            addDebugInfo(`No fileId found, trying with material ID as fallback: ${assignment.material.id}`);
                                            downloadMaterialFile(assignment.material.id, file.name || 'file.pdf');
                                          } else {
                                            window.open(file.url, '_blank');
                                          }
                                        }
                                      } catch (parseError) {
                                        console.error("Error parsing URL for fileId:", parseError);
                                        addDebugInfo(`Error parsing URL for fileId: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
                                        // As a last resort, just open in a new tab
                                        if (file.url) window.open(file.url, '_blank');
                                      }
                                    });
                                } else {
                                  // No URL and no file ID, try material ID directly
                                  if (assignment.material?.id) {
                                    downloadMaterialFile(assignment.material.id, file.name || 'file.pdf');
                                  } else {
                                    alert("Cannot download file - missing URL and ID information");
                                  }
                                }
                              }}
                            >
                              {file.name || 'Download'}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // If material doesn't have files but has an ID, show a direct download button
                    <div>
                      <Button
                        className="bg-primary hover:bg-primary-hover text-white text-xs"
                        onClick={() => {
                          if (!assignment.material?.id) {
                            addDebugInfo("Cannot download material - missing ID");
                            alert("Cannot download material - missing material ID");
                            return;
                          }
                          
                          addDebugInfo(`Attempting to download material ID: ${assignment.material.id}`);
                          
                          // Special handling for Beck Assessment
                          if ((assignment.material.name && assignment.material.name.includes("Beck")) || 
                              assignment.material.id === 44) {
                            addDebugInfo("Special handling for Beck Assessment detected");
                            downloadMaterialFile(42, `${assignment.material.name || 'Beck Assessment'}.pdf`);
                            return;
                          }
                          
                          // Use direct material download using ID
                          downloadMaterialFile(assignment.material.id, `${assignment.material.name || 'material'}.pdf`);
                        }}
                      >
                        Download Material
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 