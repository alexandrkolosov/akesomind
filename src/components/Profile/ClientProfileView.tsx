import React, { useState } from 'react';
import { ClientProfileData } from '../../hooks/useProfileData';
import Modal from '../ui/Modal';
import EditClientProfileForm from './EditClientProfileForm';

interface ClientProfileViewProps {
  data: ClientProfileData;
  isEditable?: boolean;
}

/**
 * ClientProfileView displays the profile information for clients
 * It can be used both by clients to view their own profile and by
 * therapists to view client profiles
 */
const ClientProfileView: React.FC<ClientProfileViewProps> = ({
  data,
  isEditable = false,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSave = async (updatedData: Partial<ClientProfileData>) => {
    try {
      // TODO: Implement API call to update profile
      console.log('Saving updated profile:', updatedData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  // Helper to render a profile field with icon
  const renderProfileField = (label: string, value?: string, iconPath?: string) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
          {iconPath ? (
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
            >
              <path d={iconPath} />
            </svg>
          ) : (
            <span className="text-primary dark:text-white text-xl font-bold">
              {label.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <span className="text-sm font-medium">{label}</span>
          <h4 className="text-title-md font-bold text-black dark:text-white">
            {label === 'Birthday' && value ? new Date(value).toLocaleDateString() : value}
          </h4>
        </div>
      </div>
    );
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
          {renderProfileField(
            'Birthday', 
            data.birthday,
            'M11 0C4.925 0 0 4.925 0 11s4.925 11 11 11 11-4.925 11-11S17.075 0 11 0zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z M12 6h-2v5H5v2h5v5h2v-5h5v-2h-5z'
          )}
          
          {renderProfileField(
            'Timezone', 
            data.timezone,
            'M11 0C4.925 0 0 4.925 0 11s4.925 11 11 11 11-4.925 11-11S17.075 0 11 0zm0 20c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z M11 5v6l4 4 1.5-1.5-3.5-3.5V5z'
          )}
          
          {renderProfileField('Last Session', data.lastSession)}
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
      >
        <EditClientProfileForm
          data={data}
          onSave={handleSave}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default ClientProfileView; 