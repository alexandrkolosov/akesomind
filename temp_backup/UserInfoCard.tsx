import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { fetchWithAuth, logout } from "../../utils/auth";
import { testZoneIdFormats } from "../../testZoneId";

// Example: if you need checkboxes for booleans
function Checkbox({
                    checked,
                    onChange,
                    ...props
                  }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" checked={checked} onChange={onChange} {...props} />;
}

export default function UserInfoCard({ clientId }: { clientId?: string }) {
  const { isOpen, openModal, closeModal } = useModal();

  // The data you receive from your GET endpoint
  // should align with your UpdateUser class
  // (or at least not break if fields are missing).
  const [profileData, setProfileData] = useState<any>({
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // GET user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        console.log('UserInfoCard: Fetching user details...');
        
        // Use our fetchWithAuth utility that handles 401 errors
        const endpoint = clientId 
          ? `https://api.akesomind.com/api/user/${clientId}` 
          : "https://api.akesomind.com/api/user";
        
        const data = await fetchWithAuth(endpoint);
        console.log('UserInfoCard: User details fetched successfully:', data);
        
        // Normalize zoneId to ensure consistent handling
        let normalizedZoneId;
        if (typeof data.zoneId === 'string') {
          normalizedZoneId = { id: data.zoneId };
        } else if (data.zoneId && typeof data.zoneId === 'object') {
          normalizedZoneId = data.zoneId;
        } else {
          normalizedZoneId = { id: "UTC" };
        }
        
        // Ensure zoneId is properly formatted
        const formattedData = {
          ...data,
          zoneId: normalizedZoneId
        };
        
        setProfileData(formattedData);
        setError("");
      } catch (err) {
        console.error('UserInfoCard: Error fetching user details:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred while fetching user details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [clientId]);

  // PUT request to save changes
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError("");
    setSaveSuccess(false);
    
    try {
      console.log('UserInfoCard: Saving user profile changes...');
      
      // Extract zoneId as a plain string - this is what the backend expects
      // The backend uses ZoneId.of(zoneId) where zoneId is a string parameter
      const zoneIdString = typeof profileData.zoneId === 'object' ? 
        (profileData.zoneId?.id || "UTC") : 
        (typeof profileData.zoneId === 'string' ? profileData.zoneId : "UTC");
      
      console.log('UserInfoCard: Using zoneId value:', zoneIdString);
      
      // Create a clean body object matching the backend UpdateUser class exactly
      // Keeping all fields in the request even though we're not displaying or editing some of them
      const bodyData = {
        email: profileData.email || null,
        firstName: profileData.firstName || null,
        lastName: profileData.lastName || null,
        darkTheme: profileData.darkTheme === true,
        language: profileData.language || null,
        muteNotifications: profileData.muteNotifications === true,
        phone: profileData.phone || null,
        birthday: profileData.birthday || null,
        education: profileData.education || null,
        experience: profileData.experience || null,
        approach: profileData.approach || null,
        photoId: typeof profileData.photoId === 'number' ? profileData.photoId : null,
        // Important: Send zoneId exactly as the backend expects - a plain string
        zoneId: zoneIdString
      };

      // Log the exact data being sent
      console.log('UserInfoCard: Sending update with data:', JSON.stringify(bodyData, null, 2));
      
      // Convert to a clean JSON string
      const bodyString = JSON.stringify(bodyData);
      console.log('UserInfoCard: Request body as string:', bodyString);

      // Try a direct fetch call first with minimal data to see if that works
      try {
        console.log('UserInfoCard: Attempting direct fetch with minimal data');
        const minimalData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          // Send zoneId as a simple string - this is key
          zoneId: zoneIdString,
          // Include other required fields with default values
          darkTheme: false,
          muteNotifications: false,
          language: "EN",
          phone: null,
          birthday: null,
          education: null,
          experience: null,
          approach: null,
          photoId: null
        };
        
        console.log('UserInfoCard: Minimal data:', JSON.stringify(minimalData, null, 2));
        
        const directResponse = await fetch("https://api.akesomind.com/api/user", {
          method: "PUT",
          credentials: "include", 
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(minimalData)
        });
        
        console.log('UserInfoCard: Direct fetch response status:', directResponse.status);
        
        if (directResponse.ok) {
          console.log('UserInfoCard: Direct fetch succeeded!');
          const data = await directResponse.json();
          console.log('UserInfoCard: User profile updated successfully:', data);
          setProfileData(data);
          setSaveSuccess(true);
          
          // Close modal after a short delay to show success message
          setTimeout(() => {
            closeModal();
            setSaveSuccess(false);
          }, 1500);
          return; // Exit early since we succeeded
        } else {
          console.error('UserInfoCard: Direct fetch failed, falling back to fetchWithAuth');
          const errorText = await directResponse.text();
          console.error('UserInfoCard: Direct fetch error:', errorText);
        }
      } catch (directError) {
        console.error('UserInfoCard: Direct fetch exception:', directError);
        console.log('UserInfoCard: Falling back to fetchWithAuth');
      }

      // Use our fetchWithAuth utility that handles 401 errors
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
        closeModal();
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('UserInfoCard: Error updating user profile:', err);
      if (err instanceof Error) {
        setSaveError(err.message);
      } else {
        setSaveError("An unexpected error occurred while updating your profile.");
      }
      
      // Run the test utility to help diagnose the issue
      console.log('UserInfoCard: Running test utility to determine correct zoneId format...');
      try {
        testZoneIdFormats();
      } catch (testError) {
        console.error('UserInfoCard: Error running test utility:', testError);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('UserInfoCard: User requested logout');
    logout();
  };

  // Generate avatar URL or use placeholder
  const getAvatarUrl = () => {
    // If there's a photoId in the profile data, use it to generate avatar URL
    if (profileData.photoId) {
      return `https://api.akesomind.com/api/user/avatar/${profileData.photoId}`;
    }
    
    // Generate initials from first and last name for placeholder
    const initials = `${profileData.firstName?.[0] || ''}${profileData.lastName?.[0] || ''}`.toUpperCase();
    
    // Return a placeholder avatar with initials
    return `https://ui-avatars.com/api/?name=${initials}&background=0D8ABC&color=fff&size=128`;
  };

  if (loading) return (
    <div className="flex justify-center items-center p-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
    </div>
  );
  
  if (error) return (
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
  
  if (!profileData) return null;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* User Avatar - Added at the top of the profile */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
          <img 
            src={getAvatarUrl()} 
            alt={`${profileData.firstName} ${profileData.lastName}`}
            className="w-full h-full object-cover" 
          />
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
                      <img 
                        src={getAvatarUrl()} 
                        alt="User Avatar" 
                        className="w-full h-full object-cover"
                      />
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