import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // GET user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("https://api.akesomind.com/api/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Ensure cookies are sent
        });
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        } else {
          setError("Failed to fetch user details.");
        }
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);
  const handleSave = async () => {
    try {
      const response = await fetch("https://api.akesomind.com/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the PUT request
        body: JSON.stringify({
          ...profileData,
          zoneId: { id: profileData.zoneId?.id || "" },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        closeModal();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update user details.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
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
                  Account Type
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.accountType}
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
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.phone}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Education
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.education}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Experience
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profileData.experience}
                </p>
              </div>
            </div>
          </div>
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
            <form className="flex flex-col">
              <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>ID</Label>
                    <Input
                        type="text"
                        value={profileData.id}
                        onChange={(e) =>
                            setProfileData({ ...profileData, id: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                            setProfileData({ ...profileData, email: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>First Name</Label>
                    <Input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) =>
                            setProfileData({ ...profileData, firstName: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) =>
                            setProfileData({ ...profileData, lastName: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Input
                        type="text"
                        value={profileData.accountType}
                        onChange={(e) =>
                            setProfileData({ ...profileData, accountType: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>Zone ID</Label>
                    <Input
                        type="text"
                        value={profileData.zoneId?.id || ""}
                        onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              zoneId: { id: e.target.value },
                            })
                        }
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                        type="text"
                        value={profileData.phone}
                        onChange={(e) =>
                            setProfileData({ ...profileData, phone: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>Education</Label>
                    <Input
                        type="text"
                        value={profileData.education}
                        onChange={(e) =>
                            setProfileData({ ...profileData, education: e.target.value })
                        }
                    />
                  </div>
                  <div>
                    <Label>Experience</Label>
                    <Input
                        type="text"
                        value={profileData.experience}
                        onChange={(e) =>
                            setProfileData({ ...profileData, experience: e.target.value })
                        }
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <Button size="sm" variant="outline" onClick={closeModal}>
                  Close
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
  );
}