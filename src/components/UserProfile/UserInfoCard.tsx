import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { fetchWithAuth, logout } from "../../utils/auth";

// Example: if you need checkboxes for booleans
function Checkbox({
                    checked,
                    onChange,
                    ...props
                  }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" checked={checked} onChange={onChange} {...props} />;
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();

  // The data you receive from your GET endpoint
  // should align with your UpdateUser class
  // (or at least not break if fields are missing).
  const [profileData, setProfileData] = useState<any>(null);
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
        const data = await fetchWithAuth("https://api.akesomind.com/api/user");
        console.log('UserInfoCard: User details fetched successfully:', data);
        setProfileData(data);
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
  }, []);

  // PUT request to save changes
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError("");
    setSaveSuccess(false);
    
    try {
      console.log('UserInfoCard: Saving user profile changes...');
      
      const bodyData = {
        email: profileData.email,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        experience: profileData.experience,
        approach: profileData.approach,
        birthday: profileData.birthday,
        zoneId: {
          id: profileData.zoneId?.id || "UTC",
        },
      };

      console.log('UserInfoCard: Sending update with data:', bodyData);

      // Use our fetchWithAuth utility that handles 401 errors
      const data = await fetchWithAuth("https://api.akesomind.com/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
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
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('UserInfoCard: User requested logout');
    logout();
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
                Dark Theme
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.darkTheme ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Language
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.language || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Mute Notifications
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.muteNotifications ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Birthday
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.birthday || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.phone || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Education
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.education || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Experience
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.experience || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Approach
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.approach || ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Photo ID
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profileData.photoId ?? ""}
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
                {/* Dark Theme */}
                <div>
                  <Label>Dark Theme</Label>
                  <Checkbox
                    checked={profileData.darkTheme || false}
                    onChange={(e) =>
                      setProfileData({ ...profileData, darkTheme: e.target.checked })
                    }
                  />
                </div>
                {/* Language */}
                <div>
                  <Label>Language</Label>
                  <Input
                    type="text"
                    value={profileData.language || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, language: e.target.value })
                    }
                  />
                </div>
                {/* Mute Notifications */}
                <div>
                  <Label>Mute Notifications</Label>
                  <Checkbox
                    checked={profileData.muteNotifications || false}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        muteNotifications: e.target.checked,
                      })
                    }
                  />
                </div>
                {/* Birthday */}
                <div>
                  <Label>Birthday</Label>
                  <Input
                    type="datetime-local"
                    value={profileData.birthday || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, birthday: e.target.value })
                    }
                  />
                </div>
                {/* Phone */}
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    value={profileData.phone || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                </div>
                {/* Education */}
                <div>
                  <Label>Education</Label>
                  <Input
                    type="text"
                    value={profileData.education || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, education: e.target.value })
                    }
                  />
                </div>
                {/* Experience */}
                <div>
                  <Label>Experience</Label>
                  <Input
                    type="text"
                    value={profileData.experience || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, experience: e.target.value })
                    }
                  />
                </div>
                {/* Approach */}
                <div>
                  <Label>Approach</Label>
                  <Input
                    type="text"
                    value={profileData.approach || ""}
                    onChange={(e) =>
                      setProfileData({ ...profileData, approach: e.target.value })
                    }
                  />
                </div>
                {/* Photo ID */}
                <div>
                  <Label>Photo ID</Label>
                  <Input
                    type="number"
                    value={profileData.photoId ?? 0}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        photoId: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                {/* Zone ID */}
                <div>
                  <Label>Zone ID</Label>
                  <Input
                    type="text"
                    value={profileData.zoneId?.id || "UTC"}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        zoneId: { id: e.target.value },
                      })
                    }
                  />
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