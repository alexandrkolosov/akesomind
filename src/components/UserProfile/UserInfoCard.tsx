import React, { useState, useEffect, useRef } from "react";
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

export default function UserInfoCard({ clientId }: UserInfoCardProps) {
  console.log('UserInfoCard: Component initializing', { clientId });
  const componentMounted = useRef(true);
  const { isOpen, openModal, closeModal } = useModal();
  const [isReady, setIsReady] = useState(false);

  // Check for cached data on component init
  const getCachedData = () => {
    try {
      // Get current user's email
      const userData = localStorage.getItem('userData');
      if (!userData) {
        console.log('UserInfoCard: No user data in localStorage, cannot verify cache ownership');
        return null;
      }
      
      const currentUserEmail = JSON.parse(userData).email;
      if (!currentUserEmail) {
        console.log('UserInfoCard: No email found in userData, cannot verify cache ownership');
        return null;
      }
      
      // Get cached profile with user-specific key
      const cacheKey = `userProfileData_${currentUserEmail}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Verify the cached data belongs to the current user
        if (parsedData.email === currentUserEmail) {
          console.log(`UserInfoCard: Found cached profile data for ${currentUserEmail}`);
          return parsedData;
        } else {
          console.log('UserInfoCard: Cached profile data email mismatch, clearing invalid cache');
          localStorage.removeItem(cacheKey);
          return null;
        }
      }
    } catch (e) {
      console.error('UserInfoCard: Error getting cached profile data:', e);
    }
    return null;
  };

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
      console.log('UserInfoCard: Using cached data, marking as ready');
      setIsReady(true);
    }
  }, []);

  // User Role information from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        console.log('UserInfoCard: User role information from localStorage:', {
          role: parsedData.role || 'Not set',
          email: parsedData.email || 'Not set'
        });
      } else {
        console.log('UserInfoCard: No user data found in localStorage');
      }
    } catch (error) {
      console.error('UserInfoCard: Error parsing user data from localStorage:', error);
    }
  }, []);

  // Define fetchUserDetails function outside of useEffect
  const fetchUserDetails = async () => {
    try {
      console.log('UserInfoCard: Fetching user details, initial state:', { isReady, loading });
      
      const endpoint = clientId 
        ? `https://api.akesomind.com/api/user/${clientId}` 
        : "https://api.akesomind.com/api/user";
      
      console.log('UserInfoCard: Using API endpoint:', endpoint);
      const data = await fetchWithAuth(endpoint);
      console.log('UserInfoCard: Full API response:', data);
      
      // Check for role/type information in the API response
      if (data && data.type) {
        console.log('UserInfoCard: User type from API:', data.type);
        // If we have type field, ensure we also set the role field for compatibility
        data.role = data.type;
      } else if (data && data.role) {
        console.log('UserInfoCard: User role from API:', data.role);
        // If we have role but no type, set type for forward compatibility
        if (!data.type) {
          data.type = data.role;
        }
      } else {
        console.log('UserInfoCard: No role/type information in API response, checking localStorage');
        
        // If no role in API data, check localStorage for both type and role
        try {
          const storedData = localStorage.getItem('userData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.type) {
              console.log('UserInfoCard: Using type from localStorage:', parsedData.type);
              data.type = parsedData.type;
              data.role = parsedData.type; // Set both for compatibility
            } else if (parsedData.role) {
              console.log('UserInfoCard: Using role from localStorage:', parsedData.role);
              data.role = parsedData.role;
              data.type = parsedData.role; // Set both for compatibility
            }
          }
        } catch (e) {
          console.error('UserInfoCard: Error getting role/type from localStorage:', e);
        }
      }
      
      // Normalize zoneId to ensure consistent handling
      let normalizedZoneId;
      if (typeof data.zoneId === 'string') {
        normalizedZoneId = { id: data.zoneId };
      } else if (data.zoneId && typeof data.zoneId === 'object') {
        normalizedZoneId = data.zoneId;
      } else {
        normalizedZoneId = { id: "UTC" };
      }
      
      // Check if we have avatar data
      console.log('UserInfoCard: Avatar data:', {
        photoId: data.photoId,
        avatar: data.avatar,
        avatarUrl: data.avatarUrl
      });
      
      // Ensure zoneId is properly formatted
      const formattedData = {
        ...data,
        zoneId: normalizedZoneId
      };
      
      console.log('UserInfoCard: Final formatted profile data:', formattedData);
      
      // Store the formatted data in localStorage with user-specific key
      try {
        // Get current user's email for cache key
        const userData = localStorage.getItem('userData');
        if (userData) {
          const userEmail = JSON.parse(userData).email;
          if (userEmail) {
            // First, clear any old cached data
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('userProfileData_') && !key.includes(userEmail)) {
                console.log(`UserInfoCard: Removing old cached profile for key: ${key}`);
                localStorage.removeItem(key);
              }
            });
            
            // Then save current user's data with user-specific key
            const cacheKey = `userProfileData_${userEmail}`;
            localStorage.setItem(cacheKey, JSON.stringify(formattedData));
            console.log(`UserInfoCard: Cached profile data for ${userEmail}`);
          }
        }
      } catch (e) {
        console.error('UserInfoCard: Error caching profile data:', e);
      }
      
      // Force state updates to happen in the correct order
      if (componentMounted.current) {
        // First update the profile data
        setProfileData(formattedData);
        
        // Then update loading state - CRITICAL FIX HERE
        console.log('UserInfoCard: About to set loading=false');
        setLoading(false);
        console.log('UserInfoCard: About to set isReady=true');
        setIsReady(true); 
        console.log('UserInfoCard: State updates completed');
        setError("");
      }
    } catch (err) {
      console.error('UserInfoCard: Error fetching user details:', err);
      if (componentMounted.current) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
        // Still need to end loading state on error
        console.log('UserInfoCard: Setting loading=false due to error');
        setLoading(false);
        setIsReady(true);
      }
    }
  };

  // Reset state when clientId changes
  useEffect(() => {
    // If we already have cached data, only update if it doesn't match clientId
    const cachedData = getCachedData();
    if (cachedData) {
      console.log('UserInfoCard: Found cached data on mount/update');
      if (clientId && cachedData.id !== clientId) {
        console.log('UserInfoCard: Cached data is for different client, fetching new data');
        setLoading(true);
        setIsReady(false);
        fetchUserDetails();
      } else {
        console.log('UserInfoCard: Using cached data, skipping fetch');
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
      console.log('UserInfoCard: Starting data fetch, reset loading=true, isReady=false');
      fetchUserDetails();
    }
    
    // Don't set componentMounted to false on cleanup
    // This allows state updates to complete even if parent temporarily unmounts
    return () => {
      console.log('UserInfoCard: Component cleanup - preserving data for remount');
      // Note: Not setting componentMounted.current = false;
      // This is intentional to allow state updates to complete
    };
  }, [clientId]);

  // Safety check - if we have profile data in localStorage but component is still loading,
  // this acts as a recovery mechanism for components that unmount during data fetch
  useEffect(() => {
    const checkForDataRecovery = () => {
      // If we're stuck in loading state but have cached data, recover
      if (loading && !isReady) {
        const cachedData = getCachedData();
        if (cachedData && cachedData.id) {
          console.log('UserInfoCard: Recovering from interrupted load using cached data');
          setProfileData(cachedData);
          setLoading(false);
          setIsReady(true);
        } else {
          // If we're stuck loading with no cached data, force a fresh fetch
          console.log('UserInfoCard: Stuck in loading state with no cached data, forcing refresh');
          fetchUserDetails();
        }
      }
    };
    
    // Check after a short delay to allow normal loading flow to complete
    const recoveryTimer = setTimeout(checkForDataRecovery, 2000);
    
    return () => {
      clearTimeout(recoveryTimer);
    };
  }, [loading, isReady]);

  // Add debug logging to track component lifecycle
  useEffect(() => {
    console.log('UserInfoCard: Component mount/update. Current state:', { 
      isReady, 
      loading, 
      hasProfileData: Boolean(profileData && profileData.id),
      profileType: profileData?.type || profileData?.role || 'Unknown',
      isCached: Boolean(getCachedData())
    });
    
    return () => {
      // Instead of just logging, ensure we preserve our state
      console.log('UserInfoCard: Component unmounting - preserving data');
      if (profileData && profileData.id) {
        try {
          // Get current user's email for cache key
          const userData = localStorage.getItem('userData');
          if (userData) {
            const userEmail = JSON.parse(userData).email;
            if (userEmail) {
              // Only save if email matches the profile data
              if (userEmail === profileData.email) {
                const cacheKey = `userProfileData_${userEmail}`;
                localStorage.setItem(cacheKey, JSON.stringify(profileData));
                console.log(`UserInfoCard: Preserved profile data for ${userEmail} during unmount`);
              } else {
                console.log('UserInfoCard: Email mismatch during unmount, not preserving data');
              }
            }
          }
        } catch (e) {
          console.error('UserInfoCard: Error preserving profile data during unmount:', e);
        }
      }
    };
  }, [isReady, loading, profileData]);

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
      
      // Run the test utility to help diagnose the issue
      console.log('UserInfoCard: Running test utility to determine correct zoneId format...');
      try {
        // testZoneIdFormats();
      } catch (testError) {
        console.error('UserInfoCard: Error running test utility:', testError);
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
          console.log(`UserInfoCard: Cleared cached profile data for ${userEmail}`);
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

  if (!profileData || !profileData.id) {
    console.log('UserInfoCard: Rendering no profile data state');
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
    lastName: profileData.lastName
  });

  // Double check the avatar URL
  if (!avatarUrl) {
    console.log('UserInfoCard: No avatar URL found');
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* User Avatar - Added at the top of the profile */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
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
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {profileData.firstName} {profileData.lastName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {profileData.email}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            User Profile
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
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
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Zone ID
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.zoneId?.id || ""}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
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
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto mt-2"
          >
            <svg 
              width="18" 
              height="18" 
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
                      console.log('Setting zoneId to:', zoneIdValue);
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
                          <span className="text-xl font-semibold text-gray-500 dark:text-gray-400">
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
    </div>
  );
}