import React, { useState } from 'react';
import { TherapistProfileData } from '../../hooks/useProfileData';
import Modal from '../ui/Modal';
import EditTherapistProfileForm from './EditTherapistProfileForm';

interface TherapistProfileViewProps {
  data: TherapistProfileData;
  isEditable?: boolean;
}

/**
 * TherapistProfileView displays the profile information for therapists
 * It can be used by therapists to view and edit their own profile
 */
const TherapistProfileView: React.FC<TherapistProfileViewProps> = ({
  data,
  isEditable = false,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSave = async (updatedData: Partial<TherapistProfileData>) => {
    try {
      // TODO: Implement API call to update profile
      console.log('Saving updated profile:', updatedData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="flex items-center gap-3 sm:gap-4 mb-5.5">
          <div className="relative h-20 w-20 rounded-full">
            <img src={data.avatar || '/images/user/avatar-default.png'} alt="Profile" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h3 className="font-medium text-black dark:text-white">
                {data.firstName} {data.lastName}
              </h3>
              <p className="text-sm font-medium">{data.email}</p>
              {data.phone && (
                <p className="text-sm text-black dark:text-white">{data.phone}</p>
              )}
            </div>
            {isEditable && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg
                className="fill-primary dark:fill-white"
                width="22"
                height="22"
                viewBox="0 0 22 22"
              >
                <path d="M11 0C4.925 0 0 4.925 0 11s4.925 11 11 11 11-4.925 11-11S17.075 0 11 0zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z" />
                <path d="M12 6h-2v5H5v2h5v5h2v-5h5v-2h-5z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium">Specialization</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {data.specialization}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg
                className="fill-primary dark:fill-white"
                width="22"
                height="22"
                viewBox="0 0 22 22"
              >
                <path d="M11 0C4.925 0 0 4.925 0 11s4.925 11 11 11 11-4.925 11-11S17.075 0 11 0zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z" />
                <path d="M11 5v6l4 4 1.5-1.5-3.5-3.5V5z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium">Experience</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {data.yearsOfExperience} years
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg
                className="fill-primary dark:fill-white"
                width="22"
                height="22"
                viewBox="0 0 22 22"
              >
                <path d="M11 0C4.925 0 0 4.925 0 11s4.925 11 11 11 11-4.925 11-11S17.075 0 11 0zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z" />
                <path d="M11 5v6l4 4 1.5-1.5-3.5-3.5V5z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium">Active Clients</span>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {data.activeClients || 0}
              </h4>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="mb-3 text-xl font-semibold text-black dark:text-white">
            About Me
          </h4>
          <p className="text-base text-body-color dark:text-gray-400">
            {data.bio}
          </p>
        </div>

        {data.certifications?.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 text-xl font-semibold text-black dark:text-white">
              Certifications
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="inline-block rounded-full bg-meta-2 py-1.5 px-4 text-sm font-medium text-black dark:bg-meta-4 dark:text-white"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.languages?.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 text-xl font-semibold text-black dark:text-white">
              Languages
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang, index) => (
                <span
                  key={index}
                  className="inline-block rounded-full bg-meta-2 py-1.5 px-4 text-sm font-medium text-black dark:bg-meta-4 dark:text-white"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <EditTherapistProfileForm
          data={data}
          onSave={handleSave}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default TherapistProfileView; 