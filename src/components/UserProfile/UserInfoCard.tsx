import React, { useState, useEffect, useRef, useCallback } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/Modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { fetchWithAuth, logout } from "../../utils/auth";
// import { testZoneIdFormats } from "../../testZoneId";

// Example: if you need checkboxes for booleans
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Checkbox({
  checked,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" checked={checked} onChange={onChange} {...props} />;
}

interface UserInfoCardProps {
  clientId?: string;
}

// Type definition for user data
interface UserData {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  type?: string;
  role?: string;
  zoneId?: string | { id: string };
  avatar?: string;
  phone?: string;
  birthday?: string;
  [key: string]: any; // Allow other properties
}

// Material Card Component for rendering a single material
const MaterialCard = ({ material, onDownload }: { 
  material: any, 
  onDownload: (fileId: number | string, fileName: string) => void 
}) => {
  // Handle case where material might be an assignment object with nested material
  const materialData = material.material ? material.material : material;
  
  // Skip if we don't have valid material data
  if (!materialData || !materialData.name) {
    return null;
  }

  // Function to handle URL opening
  const openUrl = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Material Header */}
      <h5 className="font-medium text-gray-800 dark:text-white/90 mb-1">
        {materialData.name || 'Untitled Material'}
        {materialData.id && (
          <span className="text-xs text-gray-500 ml-2">ID: {materialData.id}</span>
        )}
      </h5>
      
      {/* Description */}
      {materialData.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {materialData.description}
        </p>
      )}
      
      {/* Files Section */}
      {materialData.files && Array.isArray(materialData.files) && materialData.files.length > 0 && (
        <div className="mt-3">
          <p className="text-xs leading-normal text-gray-500 dark:text-gray-400 mb-2">
            Files:
          </p>
          <div className="space-y-2">
            {materialData.files.map((file: any, fileIndex: number) => {
              // Handle different file data structures
              let fileId: number | string | null = null;
              let fileName: string = `File ${fileIndex + 1}`;
              
              // Extract fileId from various possible structures
              if (typeof file === 'object') {
                // Get ID from either direct id property or extract from URL
                if (file.id !== undefined) {
                  fileId = file.id;
                } else if (file.url) {
                  // Extract ID from URL pattern like https://api.akesomind.com/api/material/file/42
                  const urlParts = file.url.split('/');
                  fileId = urlParts[urlParts.length - 1];
                }
                
                // Get filename
                fileName = file.name || fileName;
              } else if (typeof file === 'number') {
                fileId = file;
              } else if (typeof file === 'string' && file.includes('/')) {
                // Handle case where file might be a URL string
                const urlParts = file.split('/');
                fileId = urlParts[urlParts.length - 1];
                fileName = `File ${fileIndex + 1}`;
              }
              
              if (!fileId) return null;
              
              return (
                <div 
                  key={`file-${fileId}-${fileIndex}`} 
                  className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded"
                >
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                      {fileName}
                    </span>
                  </div>
                  <button
                    onClick={() => onDownload(fileId!, fileName)}
                    className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-blue-400"
                  >
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* URLs Section */}
      {materialData.urls && Array.isArray(materialData.urls) && materialData.urls.length > 0 && (
        <div className="mt-3">
          <p className="text-xs leading-normal text-gray-500 dark:text-gray-400 mb-2">
            Links:
          </p>
          <div className="space-y-2">
            {materialData.urls.map((url: string, urlIndex: number) => (
              <div 
                key={`url-${urlIndex}`} 
                className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded"
              >
                <div className="flex items-center overflow-hidden">
                  <svg 
                    className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400 mr-2" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => openUrl(url)}>
                    {url}
                  </span>
                </div>
                <button 
                  onClick={() => openUrl(url)}
                  className="ml-2 flex-shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-blue-400"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* No content message */}
      {(!materialData.files || !materialData.files.length) && 
       (!materialData.urls || !materialData.urls.length) && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
          No files or links attached to this material
        </p>
      )}
    </div>
  );
};

export default function UserInfoCard({ clientId }: UserInfoCardProps) {
  const componentMounted = useRef(true);
  const loadAttempts = useRef(0);
  const { isOpen, openModal, closeModal } = useModal();
  const [isReady, setIsReady] = useState(false);
  const [loggedInUserData, setLoggedInUserData] = useState<any>(null);
  const [isCached, setIsCached] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'materials'>('profile');
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [materialsInitialized, setMaterialsInitialized] = useState(false);

  // Memoize data loading functions
  const getCachedData = useCallback(() => {
    try {
      // Get current user's email
      const userData = localStorage.getItem('userData');
      if (!userData) {
        return null;
      }

      const currentUserEmail = JSON.parse(userData).email;
      if (!currentUserEmail) {
        return null;
      }

      // Get cached profile with user-specific key
      const cacheKey = `userProfileData_${currentUserEmail}`;
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);

        // Verify the cached data belongs to the current user
        if (parsedData.email === currentUserEmail) {
          return parsedData;
        } else {
          localStorage.removeItem(cacheKey);
          return null;
        }
      }
    } catch (e) {
      console.error('UserInfoCard: Error getting cached profile data:', e);
    }
    return null;
  }, [clientId]);

  // Load the current user's data from localStorage only once on mount
  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const parsedUserData = JSON.parse(userDataStr);
        setLoggedInUserData(parsedUserData);
      }
    } catch (e) {
      console.error('UserInfoCard: Error loading user data from localStorage:', e);
    }
    // Only run once on mount
  }, []);

  // The data you receive from your GET endpoint
  // should align with your UpdateUser class
  // (or at least not break if fields are missing).
  const [profileData, setProfileData] = useState<any>(getCachedData() || {
    email: "",
    firstName: "",
    lastName: "",
    darkTheme: false,
    language: "EN",
    muteNotifications: false,
    phone: "",
    birthday: null,
    education: "",
    experience: "",
    approach: "",
    photoId: 0,
    zoneId: { id: "UTC" }
  });

  // Initialize loading to false if we have cached data
  const [loading, setLoading] = useState(!getCachedData());
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // If we have cached data, mark as ready
  useEffect(() => {
    if (getCachedData()) {
      setIsReady(true);
    }
  }, []);

  // Format user profile data consistently
  const formatUserProfile = (userData: any): UserData => {
    // Ensure we have a properly formatted user object
    const formattedData: UserData = { ...userData };
    
    // Normalize role field
    if (userData.type && !userData.role) {
      formattedData.role = userData.type;
    } else if (userData.role && !userData.type) {
      formattedData.type = userData.role;
    }
    
    // Simple client detection logic
    const isClient = 
      formattedData.isClient === true || 
      (formattedData.type && formattedData.type.toLowerCase() === 'client') || 
      (formattedData.role && formattedData.role.toLowerCase() === 'client') ||
      (formattedData.userType && formattedData.userType.toLowerCase() === 'client');
    
    if (isClient) {
      formattedData.type = 'client';
      formattedData.role = 'client';
      formattedData.isClient = true;
    }
    
    // Normalize timezone info
    if (typeof formattedData.zoneId === 'string') {
      formattedData.zoneId = { id: formattedData.zoneId };
    } else if (!formattedData.zoneId) {
      formattedData.zoneId = { id: "UTC" };
    }
    
    return formattedData;
  };

  // Memoize fetchUserDetails to prevent recreating this function on each render
  const fetchUserDetails = useCallback(async () => {
    // Increment load attempts counter
    loadAttempts.current += 1;
    
    setLoading(true);
    setError("");

    try {
      // Always try to get stored profile data from localStorage first as a backup
      let backupData: UserData | null = null;
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          backupData = parsedData;
        }
      } catch (e) {
        console.error('UserInfoCard: Error parsing backup data:', e);
      }
      
      // Determine which endpoint to use based on whether we're viewing someone else's profile
      // If clientId is provided, we're viewing a specific user's profile
      const userIdToFetch = clientId || (backupData?.id?.toString() || '');
      const endpoint = `https://api.akesomind.com/api/user/${userIdToFetch}`;
      
      try {
        const response = await fetchWithAuth(endpoint);
        
        // If the response is valid, extract user data from it
        if (response && response.id) {
          const userProfile = formatUserProfile(response);
          setProfileData(userProfile);
          
          // If we got valid profile data, store it in localStorage for this user
          if (userProfile.email) {
            try {
              const cacheKey = `userProfileData_${userProfile.email}`;
              localStorage.setItem(cacheKey, JSON.stringify(userProfile));
              setIsCached(true);
            } catch (e) {
              console.error('UserInfoCard: Error caching profile data:', e);
            }
          }
        } 
        // If we don't get a valid response but have backup data, use that
        else if (backupData) {
          console.log('UserInfoCard: API returned empty or invalid data, using localStorage backup');
          const userProfile = formatUserProfile(backupData);
          setProfileData(userProfile);
        }
      } catch (err) {
        console.error('UserInfoCard: Error fetching user details:', err);
        setError("Failed to fetch user details. Using cached data if available.");
        
        // Use backup data on fetch error
        if (backupData) {
          console.log('UserInfoCard: Using backup data due to API error');
          const userProfile = formatUserProfile(backupData);
          setProfileData(userProfile);
        }
      }
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  }, [clientId]);

  // Reset state when clientId changes
  useEffect(() => {
    // If we already have cached data, only update if it doesn't match clientId
    const cachedData = getCachedData();
    if (cachedData) {
      if (clientId && cachedData.id !== clientId) {
        setLoading(true);
        setIsReady(false);
        fetchUserDetails();
      } else {
        setProfileData(cachedData);
        setLoading(false);
        setIsReady(true);
        return;
      }
    } else {
      // No cached data, need to fetch
      setLoading(true);
      setIsReady(false);
      setError("");
      fetchUserDetails();
    }

    // Don't set componentMounted to false on cleanup
    // This allows state updates to complete even if parent temporarily unmounts
    return () => {
      // Component cleanup - preserving data for remount
    };
  }, [clientId, fetchUserDetails]);

  // Safety check - if we have profile data in localStorage but component is still loading,
  // this acts as a recovery mechanism for components that unmount during data fetch
  useEffect(() => {
    const checkForDataRecovery = () => {
      if (!isReady && !loading && loadAttempts.current > 1) {
        // Recovering from interrupted load using cached data
        if (profileData && Object.keys(profileData).length > 0) {
          setIsReady(true);
          setLoading(false);
        } else {
          // Stuck in loading state with no cached data, forcing refresh
          fetchUserDetails();
        }
      }
    };

    // Check after a short delay to allow normal loading flow to complete
    const recoveryTimer = setTimeout(checkForDataRecovery, 2000);

    return () => {
      clearTimeout(recoveryTimer);
    };
  }, [isReady, loading, fetchUserDetails]);

  // Optimize the debug logging useEffect to run less frequently
  useEffect(() => {
    // Only perform caching when component is ready
    if (isReady) {
      // No need to log here
    }

    return () => {
      // Preserve data on unmount, but minimize logging
      if (profileData && profileData.id && profileData.email) {
        try {
          const cacheKey = `userProfileData_${profileData.email}`;
          localStorage.setItem(cacheKey, JSON.stringify(profileData));
        } catch (e) {
          console.error('UserInfoCard: Error preserving profile data during unmount:', e);
        }
      }
    };
  }, [isReady, profileData]);

  // Add a dedicated useEffect to track loading state changes
  useEffect(() => {
    console.log('UserInfoCard: Loading state changed:', { loading, isReady });
  }, [loading, isReady]);

  // PUT request to save changes
  const handleSave = async () => {
    if (!componentMounted.current) return;

    console.log('UserInfoCard: Starting save process');
    setSaveLoading(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      console.log('UserInfoCard: Preparing data for save...');

      // Extract zoneId as a plain string - this is what the backend expects
      // The backend uses ZoneId.of(zoneId) where zoneId is a string parameter
      const zoneIdString = typeof profileData.zoneId === 'object' ?
        (profileData.zoneId?.id || "UTC") :
        (typeof profileData.zoneId === 'string' ? profileData.zoneId : "UTC");

      // Record original values for debugging
      console.log('UserInfoCard: Original zoneId value:', profileData.zoneId);
      console.log('UserInfoCard: Extracted zoneId string:', zoneIdString);

      // Prepare the request body - with correct shape for zoneId and preserving type field
      const requestBody = {
        ...profileData,
        zoneId: zoneIdString,
      };

      // If we received data with type field, preserve it for the API
      if (profileData.type) {
        requestBody.type = profileData.type;
      }

      // Remove photoId if it's 0 or null
      if (!requestBody.photoId) {
        delete requestBody.photoId;
      }

      // Remove other properties that are not updatable
      delete requestBody.createdAt;
      delete requestBody.updatedAt;
      delete requestBody.avatar;
      delete requestBody.avatarUrl;

      console.log('UserInfoCard: Final request body:', JSON.stringify(requestBody, null, 2));

      // Stringify for the fetch request
      const bodyString = JSON.stringify(requestBody);

      try {
        // Try a direct fetch first to get better error messages
        console.log('UserInfoCard: Attempting direct fetch first...');
        const directResponse = await fetch("https://api.akesomind.com/api/user", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          },
          body: bodyString,
        });

        console.log('UserInfoCard: Direct fetch status:', directResponse.status);

        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          console.error('UserInfoCard: Direct fetch error:', errorText);
        }
      } catch (directError) {
        console.error('UserInfoCard: Direct fetch exception:', directError);
        console.log('UserInfoCard: Falling back to fetchWithAuth');
      }

      // Use our fetchWithAuth utility that handles 401 errors
      console.log('UserInfoCard: Using fetchWithAuth for save...');
      const data = await fetchWithAuth("https://api.akesomind.com/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: bodyString,
      });

      console.log('UserInfoCard: User profile updated successfully:', data);
      setProfileData(data);
      setSaveSuccess(true);

      // Close modal after a short delay to show success message
      setTimeout(() => {
        if (componentMounted.current) {
          closeModal();
          setSaveSuccess(false);
        }
      }, 1500);
    } catch (err) {
      console.error('UserInfoCard: Error updating user profile:', err);
      if (componentMounted.current) {
        if (err instanceof Error) {
          setSaveError(err.message);
        } else {
          setSaveError("An unexpected error occurred while updating your profile.");
        }
      }
    } finally {
      if (componentMounted.current) {
        setSaveLoading(false);
      }
    }
  };

  const handleLogout = () => {
    console.log('UserInfoCard: User requested logout');

    // Clear user-specific cached data before logout
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const userEmail = JSON.parse(userData).email;
        if (userEmail) {
          const cacheKey = `userProfileData_${userEmail}`;
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.error('UserInfoCard: Error clearing cached profile data:', e);
    }

    logout();
  };

  // Generate avatar URL or use placeholder
  const getAvatarUrl = () => {
    // Debug log to help diagnose avatar issues
    console.log('UserInfoCard: Getting avatar URL from data:', {
      avatar: profileData?.avatar,
      avatarUrl: profileData?.avatarUrl,
      photoId: profileData?.photoId
    });

    // First priority: direct avatar URL from API response
    if (profileData?.avatar) {
      console.log('UserInfoCard: Using avatar URL from API response:', profileData.avatar);
      return profileData.avatar;
    }

    // Second priority: avatarUrl field
    if (profileData?.avatarUrl) {
      console.log('UserInfoCard: Using avatarUrl from data:', profileData.avatarUrl);
      return profileData.avatarUrl;
    }

    // Third priority: constructed URL from photoId
    if (profileData?.photoId && profileData.photoId > 0) {
      const photoUrl = `https://api.akesomind.com/api/public/photo/${profileData.photoId}`;
      console.log('UserInfoCard: Using constructed URL from photoId:', photoUrl);
      return photoUrl;
    }

    // If we reach here, we'll return null and let the component render initials
    console.log('UserInfoCard: No avatar found, will render initials');
    return null;
  };

  // Track element focus for debugging
  const handleElementFocus = (element: string) => {
    console.log(`UserInfoCard: ${element} received focus`);
  };

  // Track user clicks for debugging
  const handleClick = (element: string) => {
    console.log(`UserInfoCard: User clicked on ${element}`);
  };

  // Helper function to check if user is a client
  const isUserClient = (data: any): boolean => {
    if (!data) return false;
    
    return (
      (data.type && data.type.toLowerCase() === 'client') ||
      (data.role && data.role.toLowerCase() === 'client') ||
      (data.userType && data.userType.toLowerCase() === 'client') ||
      data.isClient === true
    );
  };

  // Function to fetch materials for the client
  const fetchClientMaterials = useCallback(async () => {
    // Skip if no valid client ID is available
    if (!clientId && (!profileData?.id || !isUserClient(profileData))) {
      return;
    }

    const userId = clientId || profileData?.id?.toString();
    if (!userId) {
      return;
    }

    setIsLoadingMaterials(true);
    setMaterialsError(null);

    try {
      const response = await fetch('https://api.akesomind.com/api/material', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Handle common error responses
      if (!response.ok) {
        const errorStatus = response.status;
        if (errorStatus === 404) {
          // 404 is a normal "no materials" state, not an error
          setMaterials([]);
          setLastRefreshed(new Date());
          return;
        }
        
        throw new Error(`Failed to fetch materials: ${errorStatus} ${response.statusText}`);
      }

      // Parse the response
      const responseData = await response.json();
      
      // Find materials array regardless of response structure
      let materialsArray = extractMaterialsFromResponse(responseData);
      
      // IMPORTANT: The backend API already returns only materials assigned to the specified client
      setMaterials(materialsArray);
      
      // Update last refreshed timestamp
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching client materials:', error);
      setMaterialsError('Failed to load materials. Please try again later.');
      setMaterials([]);
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [clientId, profileData, isUserClient]);

  // Helper function to extract materials array from various API response formats
  const extractMaterialsFromResponse = (responseData: any): any[] => {
    if (!responseData) return [];
    
    // Handle different response structures
    if (Array.isArray(responseData)) {
      return responseData;
    }
    
    if (typeof responseData === 'object') {
      // Common response wrapper fields to check
      const possibleArrayFields = [
        'list', 'materials', 'content', 'data', 'items', 'results', 
        'assignments', 'materialAssignments', 'clientMaterials'
      ];
      
      // First check all common fields for arrays
      for (const field of possibleArrayFields) {
        if (responseData[field] && Array.isArray(responseData[field]) && responseData[field].length > 0) {
          return responseData[field];
        }
      }
      
      // Next try to find any array property
      const arrayProps = Object.keys(responseData).filter(key => 
        Array.isArray(responseData[key]) && responseData[key].length > 0
      );
      
      if (arrayProps.length > 0) {
        return responseData[arrayProps[0]];
      }
      
      // If we have an object with id/name/etc., it might be a single material
      if (responseData.id !== undefined || 
          responseData.materialId !== undefined ||
          responseData.name !== undefined) {
        return [responseData];
      }
    }
    
    // Last resort: return an empty array
    return [];
  };

  // Fetch materials when tab changes to 'materials'
  useEffect(() => {
    if (activeTab === 'materials' && isUserClient(profileData)) {
      // Only fetch if we haven't initialized materials and we're not currently loading
      if (!isLoadingMaterials && !materialsInitialized) {
        fetchClientMaterials();
        setMaterialsInitialized(true);
      }
    }
  }, [activeTab, profileData, fetchClientMaterials, isLoadingMaterials, materialsInitialized]);

  // Function to download a material file
  const handleDownloadFile = (fileId: number | string, fileName: string) => {
    try {
      // Ensure fileId is valid
      if (!fileId) {
        alert('Invalid file ID. Cannot download file.');
        return;
      }
      
      // Determine if fileId is a full URL or just an ID
      let downloadUrl = '';
      if (typeof fileId === 'string' && (fileId.startsWith('http://') || fileId.startsWith('https://'))) {
        // It's already a full URL
        downloadUrl = fileId;
      } else {
        // Construct API URL from the ID
        downloadUrl = `https://api.akesomind.com/api/material/file/${fileId}`;
      }
      
      // Create and click a download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName || `file-${fileId}`;
      a.target = '_self'; // Use _self to ensure it works well with credentials
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error initiating download:', error);
      alert('An error occurred while trying to download the file.');
    }
  };

  // Debug output before rendering decision
  console.log('UserInfoCard: Before render condition check:', {
    isReady,
    loading,
    hasError: Boolean(error),
    hasProfileData: Boolean(profileData && profileData.id)
  });

  // CRITICAL FIX: Only check loading state - remove isReady check
  if (loading) {
    console.log('UserInfoCard: Rendering loading spinner');
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    console.log('UserInfoCard: Rendering error state:', { error });
    return (
      <div className="p-5 border border-red-200 rounded-2xl bg-red-50 dark:border-red-800 dark:bg-red-900/20 lg:p-6">
        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Error Loading Profile
          </h4>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // If we have no profile data or no ID, check if we can show minimal data
  if (!profileData || !profileData.id) {
    console.log('UserInfoCard: No profile ID found, checking if we can construct minimal profile');
    
    // Try to create a minimal profile from localStorage data if available
    try {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        const localData = JSON.parse(storedData);
        console.log('UserInfoCard: Found localStorage data for minimal profile:', localData);
        
        // Create a minimal profile with required fields
        const minimalProfileData = {
          id: localData.id || 0,
          firstName: localData.firstName || localData.email?.split('@')[0] || 'User',
          lastName: localData.lastName || '',
          email: localData.email || '',
          type: localData.type || localData.role || profileData?.type || 'Unknown',
          role: localData.role || localData.type || profileData?.type || 'Unknown'
        };
        
        console.log('UserInfoCard: Created minimal profile:', minimalProfileData);
        
        // If we have enough data to show something useful
        if (minimalProfileData.email || minimalProfileData.firstName) {
          return (
            <div className="p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-gray-900/20 lg:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col xs:flex-row gap-4 justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {minimalProfileData.firstName} {minimalProfileData.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {minimalProfileData.email}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {minimalProfileData.type}
                    </p>
                  </div>
                  
                  {/* Placeholder for avatar */}
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xl text-gray-500 dark:text-gray-300">
                      {minimalProfileData.firstName?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          );
        }
      }
    } catch (e) {
      console.error('UserInfoCard: Error creating minimal profile:', e);
    }
    
    console.log('UserInfoCard: Unable to create minimal profile, showing no data state');
    return (
      <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20 lg:p-6">
        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-400">
            No Profile Data
          </h4>
          <p className="text-gray-600 dark:text-gray-300">Unable to retrieve profile information. Please try again.</p>
          <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl();
  console.log('UserInfoCard: Rendering profile with data:', {
    avatarUrl,
    profileType: profileData.type || profileData.role || 'Unknown',
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    canEdit: !clientId || (loggedInUserData && loggedInUserData.id && clientId === loggedInUserData.id.toString())
  });

  // Double check the avatar URL
  if (!avatarUrl) {
    console.log('UserInfoCard: No avatar URL found');
  }

  // Determine if user can edit this profile
  const canEditProfile = !clientId || (loggedInUserData && loggedInUserData.id && clientId === loggedInUserData.id.toString());

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* User Avatar and Name Section */}
      <div className="flex flex-col xs:flex-row justify-between items-center mb-6">
        <div className="flex items-center mb-4 xs:mb-0">
          <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${profileData.firstName} ${profileData.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('UserInfoCard: Avatar load error', e);
                  // Instead of setting another image that might fail, render initials
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    // Create fallback div with user initials
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center';

                    const initialsSpan = document.createElement('span');
                    initialsSpan.className = 'text-2xl font-semibold text-gray-500 dark:text-gray-400';
                    initialsSpan.textContent = `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`;

                    fallbackDiv.appendChild(initialsSpan);
                    parent.appendChild(fallbackDiv);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
                  {profileData.firstName?.charAt(0) || ''}
                  {profileData.lastName?.charAt(0) || ''}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {profileData.firstName} {profileData.lastName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profileData.email}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
              {profileData.type || profileData.role || 'User'}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {/* Only show edit button if it's the user's own profile */}
          {canEditProfile && (
            <button
              onClick={openModal}
              className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              <svg
                className="fill-current"
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                  fill=""
                />
              </svg>
              Edit
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current"
            >
              <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9 15C5.685 15 3 12.315 3 9C3 5.685 5.685 3 9 3C12.315 3 15 5.685 15 9C15 12.315 12.315 15 9 15ZM11.55 5.25L9 7.8L6.45 5.25L5.25 6.45L7.8 9L5.25 11.55L6.45 12.75L9 10.2L11.55 12.75L12.75 11.55L10.2 9L12.75 6.45L11.55 5.25Z" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit User Profile
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                {/* Email */}
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileData.email || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </div>
                {/* First Name */}
                <div>
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    value={profileData.firstName || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                  />
                </div>
                {/* Last Name */}
                <div>
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    value={profileData.lastName || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                  />
                </div>
                {/* Zone ID */}
                <div>
                  <Label>Time Zone</Label>
                  <select
                    className="w-full py-2 px-3 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10"
                    value={typeof profileData.zoneId === 'object' ? profileData.zoneId?.id || "UTC" : profileData.zoneId || "UTC"}
                    onChange={(e) => {
                      const zoneIdValue = e.target.value;
                      setProfileData({
                        ...profileData,
                        zoneId: {
                          id: zoneIdValue
                        },
                      });
                    }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select your timezone
                  </p>
                </div>
                {/* Avatar Upload Section */}
                <div className="col-span-1 lg:col-span-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center mt-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('UserInfoCard: Detail avatar load error', e);
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallbackDiv = document.createElement('div');
                              fallbackDiv.className = 'w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center';

                              const initialsSpan = document.createElement('span');
                              initialsSpan.className = 'text-xl font-semibold text-gray-500 dark:text-gray-400';
                              initialsSpan.textContent = `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`;

                              fallbackDiv.appendChild(initialsSpan);
                              parent.appendChild(fallbackDiv);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
                            {profileData.firstName?.charAt(0) || ''}
                            {profileData.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert("Profile picture upload functionality would be implemented here")}
                    >
                      Upload New Picture
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Upload a profile picture (JPG or PNG, max 2MB)
                  </p>
                </div>
              </div>
            </div>
            {saveError && (
              <div className="px-2 mt-4">
                <p className="text-red-500 text-sm">{saveError}</p>
              </div>
            )}
            {saveSuccess && (
              <div className="px-2 mt-4">
                <p className="text-green-500 text-sm">Profile updated successfully!</p>
              </div>
            )}
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveLoading}
                className={saveLoading ? "opacity-70 cursor-not-allowed" : ""}
              >
                {saveLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* User Profile Details with Tabs */}
      <div className="mt-8">
        {/* Tabs Navigation - only show Materials tab for clients */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`py-2 px-4 text-sm font-medium mr-4 ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          
          {/* Only show Materials tab for clients */}
          {isUserClient(profileData) && (
            <button
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'materials'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('materials')}
            >
              Materials
            </button>
          )}
        </div>

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              User Profile
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  ID
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.id}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.email}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  First Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.firstName}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Last Name
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.lastName}
                </p>
              </div>
              {profileData.phone && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.phone}
                  </p>
                </div>
              )}
              {profileData.birthday && (
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Birthday
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {profileData.birthday}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Time Zone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.zoneId?.id || profileData.zoneId || "UTC"}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Materials Tab Content */}
        {activeTab === 'materials' && isUserClient(profileData) && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Materials
              </h4>
              <div className="flex items-center">
                {lastRefreshed && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-4">
                    Last updated: {lastRefreshed.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => {
                    // Manual refresh - don't create loops
                    if (!isLoadingMaterials) {
                      fetchClientMaterials();
                    }
                  }}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  disabled={isLoadingMaterials}
                >
                  <svg 
                    className={`w-4 h-4 mr-1 ${isLoadingMaterials ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoadingMaterials ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {isLoadingMaterials ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : materialsError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{materialsError}</p>
                <button 
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => {
                    if (!isLoadingMaterials) {
                      fetchClientMaterials();
                    }
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : !Array.isArray(materials) ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  Unexpected data format received. Please refresh the page and try again.
                </p>
                <button 
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => {
                    if (!isLoadingMaterials) {
                      setMaterials([]);
                      fetchClientMaterials();
                    }
                  }}
                >
                  Reload Materials
                </button>
              </div>
            ) : materials.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No materials have been assigned to you yet.
                </p>
                <button 
                  className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => {
                    if (!isLoadingMaterials) {
                      fetchClientMaterials();
                    }
                  }}
                >
                  Refresh Materials
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {materials.map((material, index) => {
                  if (!material) return null;
                  
                  return (
                    <MaterialCard 
                      key={material.id || `material-${index}`} 
                      material={material} 
                      onDownload={handleDownloadFile}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}