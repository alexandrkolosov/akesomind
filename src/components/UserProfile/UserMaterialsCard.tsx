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
    // Other client fields...
  };
  material: Material;
  createdAt: string;
}

interface UserMaterialsCardProps {
  clientId?: string;
}

export default function UserMaterialsCard({ clientId }: UserMaterialsCardProps) {
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Debugging function
  const addDebugInfo = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    addDebugInfo(`UserMaterialsCard mounted with clientId: ${clientId || 'undefined'}`);
    
    // Get clientId from localStorage if not provided directly
    let effectiveClientId = clientId;
    if (!effectiveClientId) {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData.id) {
            effectiveClientId = parsedData.id.toString();
            addDebugInfo(`Retrieved clientId from localStorage: ${effectiveClientId}`);
          }
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    
    if (effectiveClientId) {
      fetchClientMaterials(parseInt(effectiveClientId, 10));
    } else {
      addDebugInfo('No clientId available, cannot fetch materials');
    }
  }, [clientId]);

  // Function to fetch client materials
  const fetchClientMaterials = async (clientId: number) => {
    setIsLoading(true);
    setError("");
    addDebugInfo(`Fetching materials for client ID: ${clientId}`);

    try {
      // First try with 'assignment' spelled correctly
      let response = await fetch(
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
      
      // If that fails with 404, try with the misspelled 'assigment'
      if (response.status === 404) {
        addDebugInfo('First endpoint returned 404, trying alternate spelling');
        response = await fetch(
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
      }

      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`Materials API Response received with ${data.list ? data.list.length : 0} total assignments`);
        
        // Filter materials for the current client
        const clientMaterials = data.list.filter(
          (assignment: MaterialAssignment) => assignment.client.id === clientId
        );
        
        addDebugInfo(`Found ${clientMaterials.length} materials for client ID ${clientId}`);
        setMaterials(clientMaterials);
      } else {
        console.error("Error fetching materials. Status:", response.status);
        addDebugInfo(`Error fetching materials. Status: ${response.status}`);
        setError("Failed to fetch materials. Please try again later.");
        try {
          const errorText = await response.text();
          addDebugInfo(`Error response: ${errorText}`);
        } catch (e) {
          addDebugInfo("Could not parse error response");
        }
      }
    } catch (error) {
      console.error("Error fetching client materials:", error);
      addDebugInfo(`Error fetching client materials: ${error instanceof Error ? error.message : String(error)}`);
      setError("An error occurred while fetching materials. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to download material file directly
  const downloadMaterialFile = async (fileId: number, fileName: string): Promise<void> => {
    addDebugInfo(`Directly downloading file ID: ${fileId}, filename: ${fileName}`);
    try {
      const fileUrl = `https://api.akesomind.com/api/material/file/${fileId}`;
      addDebugInfo(`Making request to: ${fileUrl}`);
      
      const response = await fetch(fileUrl, { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Log response headers for debugging
      addDebugInfo('Response headers received for download');
      
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
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        My Materials
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
          {materials.map((assignment) => (
            <div key={assignment.id} className="border border-gray-100 rounded-lg p-4 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {assignment.material.name}
              </h4>
              
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
                          onClick={() => {
                            addDebugInfo(`Clicked download for material ID: ${assignment.material.id}, name: ${assignment.material.name}`);
                            addDebugInfo(`File name: ${file.name}, url: ${file.url}`);
                            
                            // Special case for Beck Assessment
                            if (assignment.material.id === 44 && file.name === "BDI21.pdf") {
                              addDebugInfo("Special handling for Beck Assessment");
                              downloadMaterialFile(42, "BDI21.pdf");
                            } else {
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
                                  a.download = file.name;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  window.URL.revokeObjectURL(url);
                                  addDebugInfo(`Download completed for ${file.name}`);
                                })
                                .catch(error => {
                                  console.error("Error downloading file:", error);
                                  addDebugInfo(`Error downloading file: ${error instanceof Error ? error.message : String(error)}`);
                                  alert("Failed to download file. Opening in new tab instead.");
                                  // Fallback: Open in new tab
                                  window.open(file.url, '_blank');
                                });
                            }
                          }}
                        >
                          {file.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // If material doesn't have files but has an ID, show a direct download button
                  <div>
                    <Button
                      className="bg-primary hover:bg-primary-hover text-white text-xs"
                      onClick={() => {
                        addDebugInfo(`Attempting to download material ID: ${assignment.material.id}`);
                        
                        // Try direct material download using ID
                        fetch(`https://api.akesomind.com/api/material/${assignment.material.id}`, { 
                          credentials: 'include' 
                        })
                          .then(response => {
                            if (!response.ok) {
                              throw new Error(`HTTP error! Status: ${response.status}`);
                            }
                            return response.blob();
                          })
                          .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = `${assignment.material.name}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            addDebugInfo(`Download completed for ${assignment.material.name}`);
                          })
                          .catch(error => {
                            console.error("Error downloading material:", error);
                            addDebugInfo(`Error downloading material: ${error instanceof Error ? error.message : String(error)}`);
                            alert("Failed to download material. Opening in new tab instead.");
                            // Fallback: Open in new tab
                            window.open(`https://api.akesomind.com/api/material/${assignment.material.id}`, '_blank');
                          });
                      }}
                    >
                      Download Material
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 