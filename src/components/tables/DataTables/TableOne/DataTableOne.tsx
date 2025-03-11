"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { AngleDownIcon, AngleUpIcon } from "../../../../icons";
import PaginationWithIcon from "./PaginationWithIcon";
import { Link, useNavigate } from "react-router-dom";
import { fetchWithAuth, getUserData, logout } from "../../../../utils/auth";
import FileUploadModal from "../../../modal/FileUploadModal";

// Shape of each client item inside the "list"
interface ClientItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;      // e.g., "2025-02-19T19:28:58.303Z"
  lastSession: string;   // e.g., "2025-02-19T19:28:58.303Z"
  avatar: string;
  // "tags" is omitted here because we are not displaying it in the table,
  // but you could add it if needed:
  // tags: {
  //   list: { id: number; name: string }[];
  //   total: number;
  // };
}

// Define client detail interface for the modal
interface ClientDetail extends ClientItem {
  // Add additional fields that might come from the API
  notes?: string;
  address?: string;
  status?: string;
}

// Interface for session recordings
interface Recording {
  id: string;
  clientId: number;
  date: string;
  durationInMinutes: number;
  fileUrl?: string;
  downloadUrl?: string;
  transcriptionStage?: 'QUEUED' | 'EXTRACTED' | 'TRANSCRIBED' | 'SUMMARIZED' | 'FAILED' | string;
  summaryStatus?: 'submitted' | 'processing' | 'finished' | 'error' | string;
  actionLinks?: Array<{
    action: string;
    url: string;
  }>;
  // Nested recordings array
  recordings?: Array<{
    url?: string;
    startedAt?: string;
    durationSeconds?: number;
    maxParticipants?: number;
    summaryStatus?: string;
    transcriptionStage?: string;
    [key: string]: any; // Allow any other properties
  }>;
  // Additional fields that might be present in the API response
  recordingId?: string; // Sometimes the recording ID might be under this field
  recordingUUID?: string; // The UUID extracted from the recording URL
  transcriptUrl?: string; // Direct URL to transcript if available
  summaryUrl?: string; // Direct URL to summary if available
  url?: string; // The original URL containing the UUID
}

// Interface for material file
interface MaterialFile {
  url: string;
  name: string;
  id?: number;
}

// Interface for material
interface Material {
  id: number;
  name: string;
  isAssigned: boolean;
  description: string;
  files: MaterialFile[];
  urls: string[];
}

// Interface for material assignment
interface MaterialAssignment {
  id: number;
  client: {
    id: number;
    // Other client fields...
  };
  material: Material;
  createdAt: string;
}

// Interface for material assignment response
interface MaterialAssignmentResponse {
  list: MaterialAssignment[];
  total: number;
}

// Define the request body interface
interface ClientRequestBody {
  state: string;
  pageRequest: { offset: number; limit: number };
  name?: string; // Optional name property for search
}

// Sorting keys
type SortKey = "firstName" | "lastName" | "email" | "birthday" | "lastSession";
type SortOrder = "asc" | "desc";

// Mock data for development/testing
const MOCK_CLIENTS: ClientItem[] = [
  {
    id: 1,
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+1 (555) 123-4567",
    birthday: "1985-06-15T00:00:00.000Z",
    lastSession: "2023-05-10T14:30:00.000Z",
    avatar: "/images/user/user-01.png"
  },
  {
    id: 2,
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    phone: "+1 (555) 987-6543",
    birthday: "1990-03-22T00:00:00.000Z",
    lastSession: "2023-05-15T10:00:00.000Z",
    avatar: "/images/user/user-02.png"
  },
  {
    id: 3,
    email: "michael.johnson@example.com",
    firstName: "Michael",
    lastName: "Johnson",
    phone: "+1 (555) 456-7890",
    birthday: "1978-11-30T00:00:00.000Z",
    lastSession: "2023-05-12T16:15:00.000Z",
    avatar: "/images/user/user-03.png"
  },
  {
    id: 4,
    email: "emily.williams@example.com",
    firstName: "Emily",
    lastName: "Williams",
    phone: "+1 (555) 789-0123",
    birthday: "1992-08-05T00:00:00.000Z",
    lastSession: "2023-05-08T09:30:00.000Z",
    avatar: "/images/user/user-04.png"
  },
  {
    id: 5,
    email: "david.brown@example.com",
    firstName: "David",
    lastName: "Brown",
    phone: "+1 (555) 234-5678",
    birthday: "1983-04-17T00:00:00.000Z",
    lastSession: "2023-05-11T13:45:00.000Z",
    avatar: "/images/user/user-05.png"
  }
];

// Helper function to extract UUID from recording URL
const extractUUID = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  // Match a UUID pattern at the end of the URL
  // UUID format: 8-4-4-4-12 hex digits (e.g., f54d4a9e-226c-49ee-bb19-76804270f3e6)
  const uuidPattern = /\/recording\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i;
  const match = url.match(uuidPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return undefined;
};

export default function DataTableOne() {
  const navigate = useNavigate();
  // State to hold the array of client items
  const [tableRowData, setTableRowData] = useState<ClientItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [authDetails, setAuthDetails] = useState<string>('');
  
  // State for pagination, sorting, and searching
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("firstName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Update the state definitions
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [isLoadingClientDetails, setIsLoadingClientDetails] = useState(false);
  
  // Recordings state
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<Record<string, boolean>>({});
  const [isTranscribing, setIsTranscribing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('profile');
  
  // Materials state
  const [materials, setMaterials] = useState<MaterialAssignment[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);

  // Add a state to track cooldown periods for retry attempts
  const [summaryCooldowns, setSummaryCooldowns] = useState<Record<string, boolean>>({});
  const [transcriptCooldowns, setTranscriptCooldowns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData && userData.role) {
          setUserRole(userData.role);
          setAuthDetails(`Logged in as: ${userData.email || 'Unknown'} (${userData.role || 'No role'})`);
        } else {
          setAuthDetails("No user data found in local storage. You may need to log in again.");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setAuthDetails("Error fetching user data. Please try logging in again.");
      }
    };

    fetchUserData();
  }, []);

  // Function to fetch clients
  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await getUserData();
      if (!userData) {
        setError('User data not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      // First, check if we can access the user profile to verify our session
      const profileResponse = await fetch('https://api.akesomind.com/api/user', {
        credentials: 'include',
      });

      if (!profileResponse.ok) {
        setError('Session expired. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Simple GET request with no parameters
      const simpleResponse = await fetch('https://api.akesomind.com/api/therapist/clients', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (simpleResponse.ok) {
        const data = await simpleResponse.json();
        
        // Extract the data based on the response structure
        if (data.list && Array.isArray(data.list)) {
          setTableRowData(data.list);
          setTotalItems(data.total || data.list.length);
        } else if (Array.isArray(data)) {
          setTableRowData(data);
          setTotalItems(data.length);
        }
      } else {
        // If simple request failed, try with just the state parameter
        const stateOnlyUrl = new URL("https://api.akesomind.com/api/therapist/clients");
        stateOnlyUrl.searchParams.append("state", "all");
        
        const stateOnlyResponse = await fetch(stateOnlyUrl.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (stateOnlyResponse.ok) {
          const data = await stateOnlyResponse.json();
          
          // Extract the data based on the response structure
          if (data.list && Array.isArray(data.list)) {
            setTableRowData(data.list);
            setTotalItems(data.total || data.list.length);
          } else if (Array.isArray(data)) {
            setTableRowData(data);
            setTotalItems(data.length);
          }
        } else {
          const errorStatus = stateOnlyResponse.status;
          setError(`Unable to load client data (Error ${errorStatus}). This may be due to permission issues or browser cookie settings. Please try again later or contact support.`);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch client details for the modal
  const fetchClientDetails = async (clientId: number) => {
    setIsLoadingClientDetails(true);
    try {
      // First check if we already have the basic info in our table data
      const clientBasicInfo = tableRowData.find(client => client.id === clientId);
      
      if (!clientBasicInfo) {
        throw new Error("Client not found in table data");
      }

      // Initialize with what we already have
      const clientDetails: ClientDetail = { ...clientBasicInfo };

      // Attempt to fetch additional details if needed
      // Note: The API endpoint below might need to be adjusted based on your actual API structure
      try {
        const response = await fetch(`https://api.akesomind.com/api/therapist/clients/${clientId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const additionalData = await response.json();
          // Merge with basic info
          Object.assign(clientDetails, additionalData);
        } else {
          console.log(`Couldn't fetch additional details, using basic info only. Status: ${response.status}`);
        }
      } catch (detailsError) {
        console.error("Error fetching client details:", detailsError);
        // Continue with basic info if details fetch fails
      }

      setSelectedClient(clientDetails);
    } catch (error) {
      console.error("Error preparing client details:", error);
      setError("Failed to load client details. Please try again.");
    } finally {
      setIsLoadingClientDetails(false);
    }
  };

  // Function to fetch client recordings
  const fetchClientRecordings = async (clientId: number) => {
    setIsLoadingRecordings(true);
    try {
      const response = await fetch(
        `https://api.akesomind.com/api/session/past/client/${clientId}?offset=0&limit=10`, 
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
        console.log("Recordings data:", data); // Log the data to see its structure
        
        // Check if data is an array directly or if it has a list property that is an array
        const recordingsArray = Array.isArray(data) ? data : (data.list && Array.isArray(data.list) ? data.list : []);
        
        if (recordingsArray.length > 0) {
          // Process each recording to ensure we have complete information
          const processedRecordings = recordingsArray.map((recording: Recording) => {
            console.log("Processing recording object:", recording);
            
            // Get the UUID from the nested recording in the recordings array
            let recordingUUID: string | undefined = undefined;
            let transcriptionStage: string | undefined = undefined;
            let summaryStatus: string | undefined = undefined;
            
            // Check if there's a recordings array with items
            if (recording.recordings && recording.recordings.length > 0) {
              // For each nested recording in the recordings array, try to extract UUID from its URL
              for (const nestedRecording of recording.recordings) {
                if (nestedRecording.url) {
                  const extractedUUID = extractUUID(nestedRecording.url);
                  if (extractedUUID) {
                    recordingUUID = extractedUUID;
                    console.log(`Found UUID in nested recording: ${recordingUUID}`, nestedRecording.url);
                    
                    // Extract transcription stage and summary status from nested recording
                    if (nestedRecording.transcriptionStage) {
                      transcriptionStage = nestedRecording.transcriptionStage;
                      console.log(`Found transcriptionStage in nested recording: ${transcriptionStage}`);
                    }
                    
                    if (nestedRecording.summaryStatus) {
                      summaryStatus = nestedRecording.summaryStatus;
                      console.log(`Found summaryStatus in nested recording: ${summaryStatus}`);
                    }
                    
                    break; // Use the first valid UUID we find
                  }
                }
              }
            }
            
            // Store the UUID and status info for future reference
            recording.recordingUUID = recordingUUID;
            if (transcriptionStage) recording.transcriptionStage = transcriptionStage;
            if (summaryStatus) recording.summaryStatus = summaryStatus;
            
            // If we found a UUID, use it for all endpoints
            if (recordingUUID) {
              recording.transcriptUrl = `https://api.akesomind.com/api/recording/${recordingUUID}/transcript`;
              recording.summaryUrl = `https://api.akesomind.com/api/recording/${recordingUUID}/summary`;
              recording.fileUrl = `https://api.akesomind.com/api/recording/${recordingUUID}`; // No .mp4 extension
              recording.downloadUrl = `https://api.akesomind.com/api/recording/${recordingUUID}`; // No .mp4 extension
              console.log("Updated URLs with UUID:", recordingUUID);
              
              // Process actionLinks if they exist to identify available actions
              if (recording.actionLinks && Array.isArray(recording.actionLinks)) {
                let hasGetTranscript = false;
                let hasGetSummary = false;
                let hasGenerateSummary = false;
                
                // Loop through all action links to determine available actions
                recording.actionLinks.forEach(link => {
                  if (link.action === 'GET_TRANSCRIPT') {
                    hasGetTranscript = true;
                    console.log("Found GET_TRANSCRIPT action link");
                  } else if (link.action === 'GET_SUMMARY') {
                    hasGetSummary = true;
                    console.log("Found GET_SUMMARY action link");
                  } else if (link.action === 'GENERATE_SUMMARY') {
                    hasGenerateSummary = true;
                    console.log("Found GENERATE_SUMMARY action link");
                  }
                });
                
                // Update transcription status based on action links
                if (hasGetTranscript) {
                  // If GET_TRANSCRIPT exists, a transcript is available
                  recording.transcriptionStage = recording.transcriptionStage || 'TRANSCRIBED';
                  console.log("Setting transcriptionStage to TRANSCRIBED based on action links");
                } else if (!recording.transcriptionStage) {
                  // No transcript available and no existing status
                  recording.transcriptionStage = 'NONE';
                  console.log("No transcript available based on action links");
                }
                
                // Update summary status based on action links
                if (hasGetSummary) {
                  // If GET_SUMMARY exists, a summary is available
                  recording.summaryStatus = recording.summaryStatus || 'finished';
                  console.log("Setting summaryStatus to finished based on action links");
                } else if (hasGenerateSummary) {
                  // If GENERATE_SUMMARY exists, a summary can be generated (but doesn't exist yet)
                  recording.summaryStatus = recording.summaryStatus || 'submitted';
                  console.log("Setting summaryStatus to submitted based on action links");
                } else if (!recording.summaryStatus) {
                  // No summary available and no existing status
                  recording.summaryStatus = 'none';
                  console.log("No summary available based on action links");
                }
              }
              
              // If transcriptionStage is not set, attempt to determine if a transcript is available
              if (!recording.transcriptionStage || recording.transcriptionStage === 'NONE') {
                // Default to assuming there's no transcript
                recording.transcriptionStage = recording.transcriptionStage || 'NONE';
                
                // We'll check for transcript availability asynchronously (but won't wait for it)
                fetch(recording.transcriptUrl, {
                  method: 'HEAD',
                  credentials: 'include',
                  headers: {
                    'Accept': 'text/plain, */*',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                  }
                }).then(response => {
                  if (response.ok) {
                    console.log("Transcript exists for recording:", recording.id);
                    // Update the recording in the state
                    setRecordings(prevRecordings => {
                      return prevRecordings.map(rec => {
                        if ((rec.id === recording.id || rec.recordingId === recording.id) && rec.recordingUUID === recordingUUID) {
                          return { ...rec, transcriptionStage: 'TRANSCRIBED' };
                        }
                        return rec;
                      });
                    });
                  }
                }).catch(err => {
                  console.log("Error checking transcript availability:", err);
                });
              }
              
              // If summaryStatus is not set, attempt to determine if a summary is available
              if (!recording.summaryStatus || recording.summaryStatus === 'none') {
                // Default to assuming there's no summary
                recording.summaryStatus = recording.summaryStatus || 'none';
                
                // We'll check for summary availability asynchronously (but won't wait for it)
                fetch(recording.summaryUrl, {
                  method: 'HEAD',
                  credentials: 'include',
                  headers: {
                    'Accept': 'text/plain, */*',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                  }
                }).then(response => {
                  if (response.ok) {
                    console.log("Summary exists for recording:", recording.id);
                    // Update the recording in the state
                    setRecordings(prevRecordings => {
                      return prevRecordings.map(rec => {
                        if ((rec.id === recording.id || rec.recordingId === recording.id) && rec.recordingUUID === recordingUUID) {
                          return { ...rec, summaryStatus: 'finished' };
                        }
                        return rec;
                      });
                    });
                  }
                }).catch(err => {
                  console.log("Error checking summary availability:", err);
                });
              }
              
              // For debugging - log the final status values
              console.log("Final transcriptionStage:", recording.transcriptionStage);
              console.log("Final summaryStatus:", recording.summaryStatus);
            } else {
              // Log a warning if we couldn't find a UUID
              console.warn("Could not find UUID in nested recordings:", recording);
            }
            
            return recording;
          });
          
          setRecordings(processedRecordings);
          console.log("Processed recordings:", processedRecordings);
        } else {
          console.log("No recordings found in the response");
          setRecordings([]);
        }
      } else {
        console.error(`Couldn't fetch recordings. Status: ${response.status}`);
        setRecordings([]);
      }
    } catch (error) {
      console.error("Error fetching client recordings:", error);
      setRecordings([]);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  // Function to fetch client materials
  const fetchClientMaterials = async (clientId: number) => {
    setIsLoadingMaterials(true);
    console.log(`Fetching materials for client ID: ${clientId}`);
    try {
      // Use the exact URL specified by the user with the clientId as a query parameter
      const url = `https://api.akesomind.com/api/material/assigment`;
      console.log(`Requesting: GET ${url}`);
      
      const response = await fetch(
        url, 
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
        const data: MaterialAssignmentResponse = await response.json();
        console.log("Materials API Response:", data);
        
        // Create a deep clone of the data to avoid reference issues
        const clonedData = JSON.parse(JSON.stringify(data));
        
        // With the clientId query parameter, the API should already return only materials 
        // for the specified client, but we'll keep a check just in case
        let clientMaterials = clonedData.list;
        
        // If the API returns all materials despite the query param, filter them here
        if (clientMaterials.some((assignment: MaterialAssignment) => assignment.client.id !== clientId)) {
          console.log("API returned materials for multiple clients despite query parameter, filtering locally");
          clientMaterials = clonedData.list.filter(
            (assignment: MaterialAssignment) => assignment.client.id === clientId
          );
        }
        
        console.log(`Found ${clientMaterials.length} materials for client ID ${clientId}:`, 
          JSON.stringify(clientMaterials, null, 2));
        
        // Check for materials with files and log details
        clientMaterials.forEach((assignment: MaterialAssignment) => {
          const material = assignment.material;
          console.log(`Material ID: ${material.id}, Name: ${material.name}`);
          console.log(`- Files: ${material.files ? material.files.length : 0}`);
          // Also log the full material object for debugging
          console.log(`- Full material object: ${JSON.stringify(material)}`);
          
          if (material.files && material.files.length > 0) {
            material.files.forEach((file: MaterialFile, index: number) => {
              console.log(`  - File ${index + 1}: Name: ${file.name}, URL: ${file.url}`);
            });
          } else {
            console.log(`  - No files found for this material`);
          }
        });
        
        setMaterials(clientMaterials);
      } else {
        console.error("Error fetching materials. Status:", response.status);
        try {
          const errorText = await response.text();
          console.error("Error response:", errorText);
        } catch (e) {
          console.error("Could not parse error response");
        }
      }
    } catch (error) {
      console.error("Error fetching client materials:", error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Direct file download function with proper authentication
  const downloadMaterialFile = (fileId: number, fileName: string): void => {
    console.log(`Directly downloading file ID: ${fileId}, filename: ${fileName}`);
    const fileUrl = `https://api.akesomind.com/api/material/file/${fileId}`;
    console.log(`GET ${fileUrl}`);
    
    try {
      // Create and click a download link
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName || `file-${fileId}`;
      a.target = '_self'; // Use _self to ensure it works well with credentials
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log(`File download initiated for ${fileName}`);
    } catch (error) {
      console.error('Error initiating download:', error);
      alert('An error occurred while trying to download the file.');
    }
  };

  // Handle transcription request
  const handleRequestTranscription = async (recordingId: string) => {
    setIsTranscribing(prev => ({ ...prev, [recordingId]: true }));
    try {
      // Find the recording
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording) throw new Error("Recording not found");

      // Check if transcription is allowed based on action links
      if (recording.actionLinks && 
          Array.isArray(recording.actionLinks) && 
          recording.actionLinks.length > 0 && 
          !recording.actionLinks.some(link => 
            link.action === 'GET_TRANSCRIPT' || 
            link.action === 'GENERATE_SUMMARY')) {
        console.log("Transcription is not available for this recording based on action links");
        throw new Error("Transcription is not available for this recording");
      }

      // Use ONLY the UUID extracted from the nested recording URL
      if (!recording.recordingUUID) throw new Error("No UUID found for this recording");
      const uuidToUse = recording.recordingUUID;

      // Use the correct endpoint with GET method
      const transcriptionUrl = `https://api.akesomind.com/api/recording/${uuidToUse}/transcript`;

      // Log the URL being used
      console.log("Requesting transcription using UUID:", uuidToUse);
      console.log("Full URL:", transcriptionUrl);

      // Make the request with GET method
      console.log("Requesting transcription at:", transcriptionUrl);
      const response = await fetch(transcriptionUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/plain, */*',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        // Get response as plain text
        const textContent = await response.text();
        console.log("Transcription request successful");
        
        // Check if we got actual content back or just an acknowledgment
        const hasContent = textContent && textContent.trim().length > 0;
        // Status is 'TRANSCRIBED' if we got content back, otherwise keep as is (likely in progress)
        const newStatus = hasContent ? 'TRANSCRIBED' : recording.transcriptionStage;
        
        console.log(`Transcription status: ${newStatus} (content length: ${textContent.length})`);
        
        // Update the recording in the state with the appropriate status
        const updatedRecordings = recordings.map(rec => {
          if (rec.id === recordingId || rec.recordingId === recordingId) {
            return { ...rec, transcriptionStage: newStatus };
          }
          return rec;
        });
        setRecordings(updatedRecordings);
        
        // Only display content if we have some
        if (hasContent) {
          // Create a new window to display the transcript
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(textContent);
            newWindow.document.close();
          } else {
            console.error("Failed to open new window for transcript");
          }
        } else {
          console.log("No content returned - transcription is being processed");
        }
      } else {
        console.error("Failed to request transcription:", await response.text());
        // Update status to FAILED on error
        const updatedRecordings = recordings.map(rec => {
          if (rec.id === recordingId || rec.recordingId === recordingId) {
            return { ...rec, transcriptionStage: 'FAILED' };
          }
          return rec;
        });
        setRecordings(updatedRecordings);
        
        // Set cooldown for 10 seconds
        setTranscriptCooldowns(prev => ({ ...prev, [recordingId]: true }));
        setTimeout(() => {
          setTranscriptCooldowns(prev => ({ ...prev, [recordingId]: false }));
        }, 10000); // 10 second cooldown
      }
    } catch (error) {
      console.error("Error requesting transcription:", error);
      // Update status to FAILED on error
      const updatedRecordings = recordings.map(rec => {
        if (rec.id === recordingId || rec.recordingId === recordingId) {
          return { ...rec, transcriptionStage: 'FAILED' };
        }
        return rec;
      });
      setRecordings(updatedRecordings);
      
      // Set cooldown for 10 seconds
      setTranscriptCooldowns(prev => ({ ...prev, [recordingId]: true }));
      setTimeout(() => {
        setTranscriptCooldowns(prev => ({ ...prev, [recordingId]: false }));
      }, 10000); // 10 second cooldown
    } finally {
      setIsTranscribing(prev => ({ ...prev, [recordingId]: false }));
    }
  };

  // Handle summary generation
  const handleGenerateSummary = async (recordingId: string) => {
    setIsGeneratingSummary(prev => ({ ...prev, [recordingId]: true }));
    try {
      // Find the recording
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording) throw new Error("Recording not found");

      // Check if summary generation is allowed based on action links
      if (recording.actionLinks && 
          Array.isArray(recording.actionLinks) && 
          recording.actionLinks.length > 0 && 
          !recording.actionLinks.some(link => 
            link.action === 'GENERATE_SUMMARY' || 
            link.action === 'GET_SUMMARY')) {
        console.log("Summary generation is not available for this recording based on action links");
        throw new Error("Summary generation is not available for this recording");
      }

      // Use ONLY the UUID extracted from the nested recording URL
      if (!recording.recordingUUID) throw new Error("No UUID found for this recording");
      const uuidToUse = recording.recordingUUID;

      // Use the exact endpoint format with the UUID
      const summaryUrl = `https://api.akesomind.com/api/recording/${uuidToUse}/summary`;

      // Log the URL being used
      console.log("Requesting summary using UUID:", uuidToUse);
      console.log("Full URL:", summaryUrl);

      // Make the request with GET method
      console.log("Requesting summary at:", summaryUrl);
      const response = await fetch(summaryUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/plain, */*',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        // Get response as plain text
        const textContent = await response.text();
        console.log("Summary generation request successful");
        
        // Check if we got actual content back or just an acknowledgment
        const hasContent = textContent && textContent.trim().length > 0;
        // Status is 'finished' if we got content back, otherwise 'processing'
        const newStatus = hasContent ? 'finished' : 'processing';
        
        console.log(`Summary status: ${newStatus} (content length: ${textContent.length})`);
        
        // Update the recording in the state to reflect the appropriate status
        const updatedRecordings = recordings.map(rec => {
          if (rec.id === recordingId || rec.recordingId === recordingId) {
            return { ...rec, summaryStatus: newStatus };
          }
          return rec;
        });
        setRecordings(updatedRecordings);
        
        // Only display content if we have some
        if (hasContent) {
          // Create a new window to display the summary
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(textContent);
            newWindow.document.close();
          } else {
            console.error("Failed to open new window for summary");
          }
        } else {
          console.log("No content returned - summary is being processed");
        }
      } else {
        console.error("Failed to generate summary:", await response.text());
        // Update status to error
        const updatedRecordings = recordings.map(rec => {
          if (rec.id === recordingId || rec.recordingId === recordingId) {
            return { ...rec, summaryStatus: 'error' };
          }
          return rec;
        });
        setRecordings(updatedRecordings);
        
        // Set cooldown for 10 seconds
        setSummaryCooldowns(prev => ({ ...prev, [recordingId]: true }));
        setTimeout(() => {
          setSummaryCooldowns(prev => ({ ...prev, [recordingId]: false }));
        }, 10000); // 10 second cooldown
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      // Update status to error
      const updatedRecordings = recordings.map(rec => {
        if (rec.id === recordingId || rec.recordingId === recordingId) {
          return { ...rec, summaryStatus: 'error' };
        }
        return rec;
      });
      setRecordings(updatedRecordings);
      
      // Set cooldown for 10 seconds
      setSummaryCooldowns(prev => ({ ...prev, [recordingId]: true }));
      setTimeout(() => {
        setSummaryCooldowns(prev => ({ ...prev, [recordingId]: false }));
      }, 10000); // 10 second cooldown
    } finally {
      setIsGeneratingSummary(prev => ({ ...prev, [recordingId]: false }));
    }
  };

  // Handle viewing a transcript
  const handleViewTranscript = async (transcriptUrl: string, recordingId: string) => {
    try {
      // Find the recording to get the UUID
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording || !recording.recordingUUID) {
        console.error("No UUID found for this recording");
        // If no UUID, try using the provided transcriptUrl as fallback
        if (transcriptUrl) {
          window.open(transcriptUrl, '_blank');
          return;
        }
        throw new Error("No UUID or valid transcript URL found");
      }
      
      // Use ONLY the UUID
      const uuidToUse = recording.recordingUUID;
      
      // Ensure we're using the correct URL format with the UUID
      const url = `https://api.akesomind.com/api/recording/${uuidToUse}/transcript`;
      console.log("Opening transcript URL with UUID:", uuidToUse);
      console.log("Full URL:", url);
      
      // If transcript is already available, directly open the URL
      if (recording.transcriptionStage === 'TRANSCRIBED' || recording.transcriptionStage === 'SUMMARIZED') {
        console.log("Transcript is available - opening directly");
        window.open(url, '_blank');
        return;
      }
      
      // Otherwise, fetch the transcript data
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/plain, */*',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        // Get response as plain text
        const textContent = await response.text();
        
        // If we get content back, update the recording stage to TRANSCRIBED
        if (textContent && textContent.trim().length > 0) {
          console.log("Transcript content received - updating status to TRANSCRIBED");
          const updatedRecordings = recordings.map(rec => {
            if (rec.id === recordingId || rec.recordingId === recordingId) {
              return { ...rec, transcriptionStage: 'TRANSCRIBED' };
            }
            return rec;
          });
          setRecordings(updatedRecordings);
          
          // Create a new window to display the transcript as plain text without HTML formatting
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(textContent);
            newWindow.document.close();
          } else {
            console.error("Failed to open new window for transcript");
          }
        } else {
          console.log("No transcript content received");
          window.open(url, '_blank');
        }
      } else {
        console.error("Failed to fetch transcript:", await response.text());
        // If fetch fails, at least try to open the URL directly
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Error viewing transcript:", error);
      // If error occurs, try opening the URL directly
      if (transcriptUrl) {
        window.open(transcriptUrl, '_blank');
      }
    }
  };

  // Handle viewing a summary
  const handleViewSummary = async (summaryUrl: string, recordingId: string) => {
    try {
      // Find the recording to get the UUID
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording || !recording.recordingUUID) {
        console.error("No UUID found for this recording");
        // If no UUID, try using the provided summaryUrl as fallback
        if (summaryUrl) {
          window.open(summaryUrl, '_blank');
          return;
        }
        throw new Error("No UUID or valid summary URL found");
      }
      
      // Use ONLY the UUID
      const uuidToUse = recording.recordingUUID;
      
      // Ensure we're using the correct URL format with the UUID
      const url = `https://api.akesomind.com/api/recording/${uuidToUse}/summary`;
      console.log("Opening summary URL with UUID:", uuidToUse);
      console.log("Full URL:", url);
      
      // If the status is finished, directly open the URL
      if (recording.summaryStatus === 'finished') {
        console.log("Summary is finished - opening directly");
        window.open(url, '_blank');
        return;
      }
      
      // Otherwise, fetch the summary data
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/plain, */*',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        // Get response as plain text
        const textContent = await response.text();
        
        // If we get content back, update the summary status to finished
        if (textContent && textContent.trim().length > 0) {
          console.log("Summary content received - updating status to finished");
          const updatedRecordings = recordings.map(rec => {
            if (rec.id === recordingId || rec.recordingId === recordingId) {
              return { ...rec, summaryStatus: 'finished' };
            }
            return rec;
          });
          setRecordings(updatedRecordings);
          
          // Create a new window to display the summary as plain text without HTML formatting
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(textContent);
            newWindow.document.close();
          } else {
            console.error("Failed to open new window for summary");
          }
        } else {
          console.log("No summary content received");
          window.open(url, '_blank');
        }
      } else {
        console.error("Failed to fetch summary:", await response.text());
        // If fetch fails, at least try to open the URL directly
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Error viewing summary:", error);
      // If error occurs, try opening the URL directly
      if (summaryUrl) {
        window.open(summaryUrl, '_blank');
      }
    }
  };

  // Handle playing a recording
  const handlePlayRecording = async (fileUrl: string, recordingId: string) => {
    try {
      // Get the ID to use for the API call
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording) throw new Error("Recording not found");

      // Use ONLY the UUID from recording if available
      if (!recording.recordingUUID) throw new Error("No UUID found for this recording");
      const uuidToUse = recording.recordingUUID;

      // Construct the correct URL
      const url = `https://api.akesomind.com/api/recording/${uuidToUse}`;
      
      console.log("Playing video from URL:", url);
      
      // Create a video player modal
      const videoModal = document.createElement('div');
      videoModal.style.position = 'fixed';
      videoModal.style.top = '0';
      videoModal.style.left = '0';
      videoModal.style.width = '100%';
      videoModal.style.height = '100%';
      videoModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      videoModal.style.display = 'flex';
      videoModal.style.justifyContent = 'center';
      videoModal.style.alignItems = 'center';
      videoModal.style.flexDirection = 'column';
      videoModal.style.zIndex = '9999';
      
      // Create the video element
      const videoElement = document.createElement('video');
      videoElement.controls = true;
      videoElement.autoplay = true;
      videoElement.src = url;
      videoElement.style.maxWidth = '90%';
      videoElement.style.maxHeight = '80%';
      videoElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
      
      // Add loading message
      const loadingMessage = document.createElement('div');
      loadingMessage.textContent = 'Loading video...';
      loadingMessage.style.color = 'white';
      loadingMessage.style.marginBottom = '20px';
      loadingMessage.style.fontFamily = 'Arial, sans-serif';
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.marginTop = '20px';
      closeButton.style.padding = '10px 20px';
      closeButton.style.backgroundColor = '#f44336';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontFamily = 'Arial, sans-serif';
      
      closeButton.onclick = () => {
        document.body.removeChild(videoModal);
      };
      
      // Add event listeners for video loading
      videoElement.oncanplay = () => {
        videoModal.removeChild(loadingMessage);
      };
      
      videoElement.onerror = () => {
        loadingMessage.textContent = 'Error loading video. Trying direct link...';
        setTimeout(() => {
          // If video fails to load in the player, try opening directly
          window.open(url, '_blank');
          document.body.removeChild(videoModal);
        }, 2000);
      };
      
      // Add everything to the modal
      videoModal.appendChild(loadingMessage);
      videoModal.appendChild(videoElement);
      videoModal.appendChild(closeButton);
      
      // Add the modal to the page
      document.body.appendChild(videoModal);
      
      // Also close modal when clicking outside the video
      videoModal.onclick = (e) => {
        if (e.target === videoModal) {
          document.body.removeChild(videoModal);
        }
      };
    } catch (error) {
      console.error("Error playing recording:", error);
      alert("Error playing recording. Please try again.");
    }
  };

  // Handle downloading a recording
  const handleDownloadRecording = async (downloadUrl: string, recordingId: string) => {
    try {
      // Get the recording to use the UUID
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording) throw new Error("Recording not found");

      // Use ONLY the UUID extracted from the recording
      if (!recording.recordingUUID) throw new Error("No UUID found for this recording");
      const uuidToUse = recording.recordingUUID;

      // Construct the correct URL - without .mp4 extension to match the working example
      const url = `https://api.akesomind.com/api/recording/${uuidToUse}`;
      
      console.log("Downloading from URL:", url);
      
      // Simply open the URL in a new tab - the browser will handle the download
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error downloading recording:", error);
      alert("Error downloading recording. Please try again.");
    }
  };

  // Handle opening the client details modal
  const handleOpenClientModal = (clientId: number) => {
    fetchClientDetails(clientId);
    fetchClientRecordings(clientId);
    fetchClientMaterials(clientId);
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    setRecordings([]);
    setMaterials([]);
    setActiveTab('profile');
  };

  // Handle opening the file upload modal
  const handleOpenFileUploadModal = () => {
    setIsFileUploadModalOpen(true);
  };

  // Handle closing the file upload modal
  const handleCloseFileUploadModal = () => {
    setIsFileUploadModalOpen(false);
  };

  // Handle successful file upload
  const handleFileUploadSuccess = () => {
    // Refresh materials list
    if (selectedClient) {
      fetchClientMaterials(selectedClient.id);
    }
  };

  // Handle deleting a material
  const handleDeleteMaterial = async (materialId: number) => {
    if (!selectedClient) return;
    
    try {
      console.log(`Deleting material with ID: ${materialId}`);
      console.log(`DELETE /api/material/${materialId}`);
      
      const response = await fetch(`https://api.akesomind.com/api/material/${materialId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Material deletion failed with status: ${response.status}`);
      }
      
      console.log(`Material deleted successfully`);
      
      // Remove the material from the UI
      setMaterials(prevMaterials => 
        prevMaterials.filter(assignment => assignment.material.id !== materialId)
      );
      
    } catch (error) {
      console.error("Error deleting material:", error);
      alert(`Failed to delete material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchClients();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Pagination logic - simplified since backend handles pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = tableRowData; // Use data directly from the API

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Handle logout and redirect to login
  const handleLoginRedirect = () => {
    logout(); // Clear any existing auth data
    navigate('/signin');
  };

  // Force refresh the page to reload authentication
  const handleForceRefresh = () => {
    window.location.reload();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle requesting transcription to check if one already exists
  const checkTranscriptAvailability = async (recordingId: string) => {
    try {
      // Find the recording
      const recording = recordings.find(r => r.id === recordingId || r.recordingId === recordingId);
      if (!recording) throw new Error("Recording not found");

      // Use ONLY the UUID extracted from the nested recording URL
      if (!recording.recordingUUID) throw new Error("No UUID found for this recording");
      const uuidToUse = recording.recordingUUID;

      // Use the correct endpoint with GET method
      const transcriptionUrl = `https://api.akesomind.com/api/recording/${uuidToUse}/transcript`;
      
      console.log("Checking transcript availability at:", transcriptionUrl);
      
      // Make a HEAD request first to check if transcript exists
      const response = await fetch(transcriptionUrl, {
        method: 'HEAD',
        credentials: 'include',
        headers: {
          'Accept': 'text/plain, */*',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        console.log("Transcript exists for recording:", recordingId);
        // Update the recording in the state
        const updatedRecordings = recordings.map(rec => {
          if (rec.id === recordingId || rec.recordingId === recordingId) {
            return { ...rec, transcriptionStage: 'TRANSCRIBED' };
          }
          return rec;
        });
        setRecordings(updatedRecordings);
        return true;
      } else {
        console.log("No transcript available for:", recordingId);
        return false;
      }
    } catch (error) {
      console.error("Error checking transcript availability:", error);
      return false;
    }
  };

  useEffect(() => {
    // When recordings change, check transcript availability for each recording
    recordings.forEach(recording => {
      const recordingId = recording.recordingId || recording.id;
      if (recordingId && recording.recordingUUID && 
         (!recording.transcriptionStage || 
           recording.transcriptionStage === 'NONE' || 
           recording.transcriptionStage === 'unknown')) {
        checkTranscriptAvailability(recordingId);
      }
    });
  }, [recordings]);

  // Handle tab change in client modal
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    console.log(`Changed to tab: ${tab}`);
    
    // When changing to materials tab, log the current materials
    if (tab === 'materials' && materials.length > 0) {
      console.log(`Current materials count: ${materials.length}`);
      
      // Debug - Log each material
      materials.forEach((assignment, index) => {
        const material = assignment.material;
        console.log(`Tab Material ${index+1} - ID: ${material.id}, Name: ${material.name}`);
        console.log(`- Has files: ${material.files && material.files.length > 0}`);
        console.log(`- Files count: ${material.files ? material.files.length : 0}`);
        
        // Log each file if available
        if (material.files && material.files.length > 0) {
          material.files.forEach((file, fileIndex) => {
            console.log(`  - File ${fileIndex+1}: ${file.name}, URL: ${file.url}`);
          });
        }
        
        // Log full material object to debug structure
        console.log(`Full material object for ${material.name}:`, JSON.stringify(material));
      });
    }
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {/* Show auth details if there's an error */}
      {error && authDetails && (
        <div className="p-4 mx-4 mt-4 text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded">
          <p>{authDetails}</p>
        </div>
      )}
      
      {/* Show error if there is one */}
      {error && (
        <div className="p-4 m-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
          <p className="mb-3">{error}</p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleLoginRedirect}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              Go to Login Page
            </button>
            <button 
              onClick={handleForceRefresh}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
        </div>
      )}

      {/* Top Bar: Items per page & Search */}
      <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
        {/* Items per page */}
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400"> Show </span>
          <div className="relative z-20 bg-transparent">
            <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              {[2, 5, 10].map((value) => (
                  <option
                      key={value}
                      value={value}
                      className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {value}
                  </option>
              ))}
            </select>
            <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
            <svg
                className="stroke-current"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
              <path
                  d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              />
            </svg>
          </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400"> entries </span>
        </div>

        {/* Search */}
        <div className="relative">
          <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
            <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
              <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  fill=""
              />
            </svg>
          </button>

          <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset to first page on search
              }}
              placeholder="Search..."
              className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {[
                { key: "avatar", label: "Avatar", sortable: false },
                { key: "firstName", label: "First Name", sortable: true },
                { key: "lastName", label: "Last Name", sortable: true },
                { key: "email", label: "Email", sortable: true },
                { key: "birthday", label: "Birthday", sortable: true },
                { key: "lastSession", label: "Last Session", sortable: true },
              ].map(({ key, label, sortable }) => (
                  <TableCell
                      key={key}
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div
                        className={`flex items-center ${
                            sortable ? "justify-between cursor-pointer" : ""
                        }`}
                        onClick={() => sortable && handleSort(key as SortKey)}
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        {label}
                      </p>
                      {sortable && (
                          <button className="flex flex-col gap-0.5">
                            <AngleUpIcon
                                className={`text-gray-300 dark:text-gray-700 ${
                                    sortKey === key && sortOrder === "asc"
                                        ? "text-brand-500"
                                        : ""
                                }`}
                            />
                            <AngleDownIcon
                                className={`text-gray-300 dark:text-gray-700 ${
                                    sortKey === key && sortOrder === "desc"
                                        ? "text-brand-500"
                                        : ""
                                }`}
                            />
                          </button>
                      )}
                    </div>
                  </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <TableRow key={item.id}>
                  {/* Avatar */}
                  <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 overflow-hidden rounded-full cursor-pointer"
                        onClick={() => handleOpenClientModal(item.id)}
                      >
                        <img
                          src={item.avatar || "/images/user/user-01.png"}
                          className="size-10"
                          alt="avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/user/user-01.png";
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* First Name */}
                  <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                    <span 
                      className="cursor-pointer hover:text-brand-500 hover:underline"
                      onClick={() => handleOpenClientModal(item.id)}
                    >
                      {item.firstName}
                    </span>
                  </TableCell>

                  {/* Last Name */}
                  <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                    <span 
                      className="cursor-pointer hover:text-brand-500 hover:underline"
                      onClick={() => handleOpenClientModal(item.id)}
                    >
                      {item.lastName}
                    </span>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                    <span 
                      className="cursor-pointer hover:text-brand-500 hover:underline"
                      onClick={() => handleOpenClientModal(item.id)}
                    >
                      {item.email}
                    </span>
                  </TableCell>

                  {/* Birthday */}
                  <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                    {item.birthday ? formatDate(item.birthday) : ""}
                  </TableCell>

                  {/* Last Session */}
                  <TableCell className="px-4 py-3 font-normal dark:text-gray-400/90 text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm whitespace-nowrap">
                    {item.lastSession ? new Date(item.lastSession).toLocaleString() : ""}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/[0.05]"
                >
                  <div className="w-full text-center" style={{ gridColumn: 'span 6 / span 6' }}>
                    {isLoading ? "Loading clients..." : error ? "Error loading clients" : "No clients found"}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: Pagination */}
      <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          {/* Left side: Showing entries */}
          <div className="pb-3 xl:pb-0">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              {totalItems > 0 
                ? `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries` 
                : "No entries to display"}
            </p>
          </div>
          {totalPages > 0 && (
            <PaginationWithIcon
              totalPages={totalPages}
              initialPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Client Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseModal}>
          <div 
            className="w-full max-w-4xl p-6 mx-4 bg-white rounded-lg shadow-lg dark:bg-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Client Profile
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex flex-wrap -mb-px">
                <button 
                  className={`item-center relative flex cursor-pointer w-1/3 rounded-md text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'bg-white text-primary dark:bg-boxdark dark:text-white'
                      : 'bg-[#F5F7FD] text-body dark:bg-boxdark-2 dark:text-bodydark'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <span className="w-full py-4">Profile</span>
                </button>
                <button 
                  className={`item-center relative flex cursor-pointer w-1/3 rounded-md text-sm font-medium ${
                    activeTab === 'recordings'
                      ? 'bg-white text-primary dark:bg-boxdark dark:text-white'
                      : 'bg-[#F5F7FD] text-body dark:bg-boxdark-2 dark:text-bodydark'
                  }`}
                  onClick={() => {
                    setActiveTab('recordings');
                    // Fetch fresh recordings data when switching to this tab
                    if (selectedClient) {
                      fetchClientRecordings(selectedClient.id);
                    }
                  }}
                >
                  <span className="w-full py-4">Recordings</span>
                </button>
                <button 
                  className={`item-center relative flex cursor-pointer w-1/3 rounded-md text-sm font-medium ${
                    activeTab === 'materials'
                      ? 'bg-white text-primary dark:bg-boxdark dark:text-white'
                      : 'bg-[#F5F7FD] text-body dark:bg-boxdark-2 dark:text-bodydark'
                  }`}
                  onClick={() => {
                    setActiveTab('materials');
                    // Fetch fresh materials data when switching to this tab
                    if (selectedClient) {
                      fetchClientMaterials(selectedClient.id);
                    }
                  }}
                >
                  <span className="w-full py-4">Materials</span>
                </button>
              </div>
            </div>

            {isLoadingClientDetails && activeTab === 'profile' ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
              </div>
            ) : selectedClient && activeTab === 'profile' ? (
              <div className="space-y-6">
                {/* Client Avatar & Basic Info */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {/* Using preload technique to avoid blinking */}
                    <img
                      src={selectedClient.avatar || "/images/user/user-01.png"}
                      alt={`${selectedClient.firstName} ${selectedClient.lastName}`}
                      className="w-full h-full object-cover"
                      loading="eager"
                      onError={(e) => {
                        if ((e.target as HTMLImageElement).src !== "/images/user/user-01.png") {
                          (e.target as HTMLImageElement).src = "/images/user/user-01.png";
                        }
                      }}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {`${selectedClient.firstName} ${selectedClient.lastName}`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{selectedClient.email}</p>
                    <p className="text-gray-500 dark:text-gray-400">{selectedClient.phone || "No phone number"}</p>
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Birthday</h4>
                    <p className="text-gray-800 dark:text-white">{selectedClient.birthday ? formatDate(selectedClient.birthday) : "Not available"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Session</h4>
                    <p className="text-gray-800 dark:text-white">{selectedClient.lastSession ? new Date(selectedClient.lastSession).toLocaleString() : "No sessions recorded"}</p>
                  </div>
                  {selectedClient.address && (
                    <div className="col-span-full">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Address</h4>
                      <p className="text-gray-800 dark:text-white">{selectedClient.address}</p>
                    </div>
                  )}
                  {selectedClient.status && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                      <p className="text-gray-800 dark:text-white">{selectedClient.status}</p>
                    </div>
                  )}
                </div>

                {/* Notes Section (if available) */}
                {selectedClient.notes && (
                  <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</h4>
                      <p className="text-gray-800 dark:text-white whitespace-pre-line">{selectedClient.notes}</p>
                    </div>
                  </>
                )}
              </div>
            ) : isLoadingRecordings && activeTab === 'recordings' ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
              </div>
            ) : activeTab === 'recordings' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Session Recordings
                </h3>
                
                {recordings.length > 0 ? (
                  <div className="space-y-4">
                    {recordings.map((recording) => {
                      // Determine the recording ID to use - prefer recordingId if available
                      const recordingId = recording.recordingId || recording.id;
                      
                      // Check if transcript is available or can be generated
                      const hasTranscript = recording.transcriptionStage === 'TRANSCRIBED' || 
                                           recording.transcriptionStage === 'SUMMARIZED';
                      
                      // Check if summary is available or can be generated
                      const hasSummary = recording.summaryStatus === 'finished';
                      
                      // The recording should always be playable if we have an ID
                      const canPlay = Boolean(recordingId);
                      
                      // The recording should always be downloadable if we have an ID
                      const canDownload = Boolean(recordingId);
                      
                      // Debug log to help identify why buttons might be disabled
                      console.log(`Recording ${recordingId} status:`, {
                        transcriptionStage: recording.transcriptionStage,
                        hasTranscript,
                        summaryStatus: recording.summaryStatus, 
                        hasSummary,
                        recordingUUID: recording.recordingUUID
                      });
                      
                      return (
                        <div 
                          key={recordingId} 
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                            <div>
                              <h4 className="font-medium text-gray-800 dark:text-white">
                                Session on {formatDate(recording.date)}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Duration: {recording.durationInMinutes} minutes
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Recording ID: {recordingId}
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Transcription: {
                                  recording.transcriptionStage === 'QUEUED' 
                                    ? 'Queued' 
                                    : recording.transcriptionStage === 'EXTRACTED'
                                      ? 'Audio Extracted'
                                      : recording.transcriptionStage === 'TRANSCRIBED'
                                        ? 'Transcribed'
                                        : recording.transcriptionStage === 'SUMMARIZED'
                                          ? 'Summarized'
                                          : recording.transcriptionStage === 'FAILED'
                                            ? 'Failed'
                                            : (recording.actionLinks && 
                                               Array.isArray(recording.actionLinks) && 
                                               recording.actionLinks.length > 0 && 
                                               !recording.actionLinks.some(link => 
                                                 link.action === 'GET_TRANSCRIPT' || 
                                                 link.action === 'GENERATE_SUMMARY'))
                                               ? 'Not Available'
                                               : 'Not Started'
                                }
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Summary: {
                                  recording.summaryStatus === 'submitted'
                                    ? 'Submitted'
                                    : recording.summaryStatus === 'processing'
                                      ? 'Processing'
                                      : recording.summaryStatus === 'finished'
                                        ? 'Completed'
                                        : recording.summaryStatus === 'error'
                                          ? 'Error'
                                          : (recording.actionLinks && 
                                             Array.isArray(recording.actionLinks) && 
                                             recording.actionLinks.length > 0 && 
                                             !recording.actionLinks.some(link => 
                                               link.action === 'GENERATE_SUMMARY' || 
                                               link.action === 'GET_SUMMARY'))
                                             ? 'Not Available'
                                             : 'Not Started'
                                }
                              </p>
                              {recording.actionLinks && Array.isArray(recording.actionLinks) && recording.actionLinks.length > 0 && (
                                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                                  Available actions: {recording.actionLinks.map(link => link.action.replace('_', ' ')).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* Play Button */}
                            <button
                              onClick={() => handlePlayRecording(recording.fileUrl || '', recordingId)}
                              disabled={!canPlay}
                              className={`px-3 py-1.5 text-xs font-medium rounded ${
                                canPlay
                                  ? 'bg-brand-500 text-white hover:bg-brand-600 dark:bg-brand-700 dark:hover:bg-brand-600'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              Play
                            </button>
                            
                            {/* Download Button */}
                            <button
                              onClick={() => handleDownloadRecording(recording.downloadUrl || '', recordingId)}
                              disabled={!canDownload}
                              className={`px-3 py-1.5 text-xs font-medium rounded ${
                                canDownload
                                  ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              Download
                            </button>
                            
                            {/* Transcript Button - Either View or Request */}
                            {hasTranscript ? (
                              <button
                                onClick={() => handleViewTranscript(recording.transcriptUrl || '', recordingId)}
                                className="px-3 py-1.5 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                              >
                                View Transcript
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRequestTranscription(recordingId)}
                                disabled={
                                  isTranscribing[recordingId] || 
                                  recording.transcriptionStage === 'QUEUED' || 
                                  recording.transcriptionStage === 'EXTRACTED' ||
                                  transcriptCooldowns[recordingId] ||
                                  // If there are action links but no GET_TRANSCRIPT or GENERATE_SUMMARY, 
                                  // it means the transcript feature is not available for this recording
                                  (recording.actionLinks && 
                                   Array.isArray(recording.actionLinks) && 
                                   recording.actionLinks.length > 0 && 
                                   !recording.actionLinks.some(link => 
                                     link.action === 'GET_TRANSCRIPT' || 
                                     link.action === 'GENERATE_SUMMARY'))
                                }
                                className={`px-3 py-1.5 text-xs font-medium rounded ${
                                  isTranscribing[recordingId]
                                    ? 'bg-yellow-400 text-white cursor-wait dark:bg-yellow-600'
                                    : recording.transcriptionStage === 'QUEUED'
                                      ? 'bg-yellow-400 text-white cursor-wait dark:bg-yellow-600'
                                      : recording.transcriptionStage === 'EXTRACTED'
                                        ? 'bg-yellow-400 text-white cursor-wait dark:bg-yellow-600'
                                        : transcriptCooldowns[recordingId]
                                          ? 'bg-gray-400 text-white cursor-wait dark:bg-gray-600'
                                          : recording.transcriptionStage === 'FAILED'
                                            ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600'
                                            : (recording.actionLinks && 
                                               Array.isArray(recording.actionLinks) && 
                                               recording.actionLinks.length > 0 && 
                                               !recording.actionLinks.some(link => 
                                                 link.action === 'GET_TRANSCRIPT' || 
                                                 link.action === 'GENERATE_SUMMARY'))
                                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                              : 'bg-purple-500 text-white hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600'
                                }`}
                              >
                                {isTranscribing[recordingId]
                                  ? 'Processing...'
                                  : recording.transcriptionStage === 'QUEUED'
                                    ? 'Queued'
                                    : recording.transcriptionStage === 'EXTRACTED'
                                      ? 'Extracting...'
                                      : transcriptCooldowns[recordingId]
                                        ? 'Cooling down...'
                                        : recording.transcriptionStage === 'FAILED'
                                          ? 'Retry Transcription'
                                          : (recording.actionLinks && 
                                             Array.isArray(recording.actionLinks) && 
                                             recording.actionLinks.length > 0 && 
                                             !recording.actionLinks.some(link => 
                                               link.action === 'GET_TRANSCRIPT' || 
                                               link.action === 'GENERATE_SUMMARY'))
                                            ? 'Unavailable'
                                            : 'Transcribe'
                                }
                              </button>
                            )}
                            
                            {/* Summary Button - Enable if transcript exists */}
                            {recording.summaryStatus === 'finished' ? (
                              <button
                                onClick={() => handleViewSummary(recording.summaryUrl || '', recordingId)}
                                className="px-3 py-1.5 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                              >
                                Read Summary
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGenerateSummary(recordingId)}
                                disabled={
                                  isGeneratingSummary[recordingId] || 
                                  recording.summaryStatus === 'processing' ||
                                  summaryCooldowns[recordingId] ||
                                  !hasTranscript || // Only enable if transcript is available
                                  // If there are action links but no GENERATE_SUMMARY, 
                                  // it means the summary feature is not available for this recording
                                  (recording.actionLinks && 
                                   Array.isArray(recording.actionLinks) && 
                                   recording.actionLinks.length > 0 && 
                                   !recording.actionLinks.some(link => 
                                     link.action === 'GENERATE_SUMMARY' || 
                                     link.action === 'GET_SUMMARY'))
                                }
                                className={`px-3 py-1.5 text-xs font-medium rounded ${
                                  isGeneratingSummary[recordingId] || recording.summaryStatus === 'processing'
                                    ? 'bg-yellow-400 text-white cursor-wait dark:bg-yellow-600'
                                    : summaryCooldowns[recordingId]
                                      ? 'bg-gray-400 text-white cursor-wait dark:bg-gray-600'
                                      : !hasTranscript
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                        : recording.summaryStatus === 'error'
                                          ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600'
                                          : (recording.actionLinks && 
                                             Array.isArray(recording.actionLinks) && 
                                             recording.actionLinks.length > 0 && 
                                             !recording.actionLinks.some(link => 
                                               link.action === 'GENERATE_SUMMARY' || 
                                               link.action === 'GET_SUMMARY'))
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                            : 'bg-teal-500 text-white hover:bg-teal-600 dark:bg-teal-700 dark:hover:bg-teal-600'
                                }`}
                              >
                                {isGeneratingSummary[recordingId]
                                  ? 'Processing...'
                                  : recording.summaryStatus === 'processing'
                                    ? 'Processing...'
                                    : summaryCooldowns[recordingId]
                                      ? 'Cooling down...'
                                      : recording.summaryStatus === 'error'
                                        ? 'Retry Summary'
                                        : (recording.actionLinks && 
                                           Array.isArray(recording.actionLinks) && 
                                           recording.actionLinks.length > 0 && 
                                           !recording.actionLinks.some(link => 
                                             link.action === 'GENERATE_SUMMARY' || 
                                             link.action === 'GET_SUMMARY'))
                                          ? 'Unavailable'
                                          : 'Generate Summary'
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No recordings found for this client.
                  </div>
                )}
              </div>
            ) : isLoadingMaterials && activeTab === 'materials' ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
              </div>
            ) : activeTab === 'materials' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Client Materials
                  </h3>
                  <button
                    onClick={handleOpenFileUploadModal}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Upload Material
                  </button>
                </div>
                
                {materials.length > 0 ? (
                  <div className="space-y-4">
                    {materials.map((assignment) => {
                      const material = assignment.material;
                      
                      return (
                        <div 
                          key={assignment.id} 
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-800 dark:text-white">
                              {material.name}
                            </h4>
                            <button 
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete material"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Added on {new Date(assignment.createdAt).toLocaleDateString()}
                          </p>
                          
                          {material.description && (
                            <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                              {material.description}
                            </p>
                          )}
                          
                          {material.files && material.files.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Files:
                              </p>
                              <div className="space-y-2">
                                {material.files.map((file, fileIndex) => (
                                  <div 
                                    key={fileIndex}
                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md"
                                  >
                                    <div className="flex items-center">
                                      <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                      <span className="text-sm text-gray-800 dark:text-white">{file.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <button
                                        onClick={() => downloadMaterialFile(file.id || fileIndex, file.name)}
                                        className="flex items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-blue-400"
                                        title="Download file"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                        </svg>
                                        Download
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {material.urls && material.urls.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                URLs:
                              </p>
                              <div className="space-y-2">
                                {material.urls.map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                    </svg>
                                    <p className="tw-w-full tw-truncate tw-text-left">{url}</p>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No materials found for this client. Click "Upload Material" to add materials.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Failed to load data</p>
              </div>
            )}

            {/* Footer with action buttons */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {selectedClient && (
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={handleCloseFileUploadModal}
          client={selectedClient}
          onUploadSuccess={handleFileUploadSuccess}
        />
      )}
    </div>
  );
}