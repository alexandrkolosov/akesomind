import React, { useState, useEffect } from 'react';
import { TherapistProfileData } from '../../hooks/useProfileData';
import Modal from '../ui/Modal';
import EditTherapistProfileForm from './EditTherapistProfileForm';
import { Link } from 'react-router-dom';

interface TherapistProfileViewProps {
  data: TherapistProfileData;
  isEditable?: boolean;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState('09:00');
  const [sessionEndTime, setSessionEndTime] = useState('10:00');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);

  useEffect(() => {
    // If the new session modal is opened, fetch clients
    if (isNewSessionModalOpen) {
      fetchClients();
    }
  }, [isNewSessionModalOpen]);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    setClientsError(null);
    
    try {
      const response = await fetch('https://api.akesomind.com/api/therapist/clients', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract the client data based on the response structure
        if (data.list && Array.isArray(data.list)) {
          setClients(data.list);
        } else if (Array.isArray(data)) {
          setClients(data);
        }
      } else {
        // Try with state parameter if simple request failed
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
          if (data.list && Array.isArray(data.list)) {
            setClients(data.list);
          } else if (Array.isArray(data)) {
            setClients(data);
          }
        } else {
          setClientsError('Failed to fetch clients. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClientsError('An error occurred while fetching clients.');
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleSave = async (updatedData: Partial<TherapistProfileData>) => {
    try {
      // TODO: Implement API call to update profile
      console.log('Saving updated profile:', updatedData);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCreateSession = async () => {
    // Validate form fields
    if (!sessionTitle.trim()) {
      setSessionError('Please enter a session title');
      return;
    }
    
    if (!sessionDate) {
      setSessionError('Please select a session date');
      return;
    }
    
    if (!selectedClientId) {
      setSessionError('Please select a client for the session');
      return;
    }

    setIsCreatingSession(true);
    setSessionError(null);
    setSessionSuccess(null);
    
    try {
      // Combine date and time for start time
      const startDateTime = new Date(`${sessionDate}T${sessionStartTime}`);
      const endDateTime = new Date(`${sessionDate}T${sessionEndTime}`);
      
      // Calculate duration in minutes
      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
      
      // Create session payload according to API requirements
      const sessionData = {
        clientId: selectedClientId,
        startsAt: startDateTime.toISOString(),
        durationMinutes: durationMinutes,
        status: "OPEN_FOR_BOOKING",
        isRecurring: false,
        // Fixed: Using "note" (singular) instead of "notes" to match API expectations
        note: sessionTitle,
        currency: "USD",
        costInCents: 0
      };
      
      console.log('Sending session data:', sessionData);
      
      // Call the API to create a new session
      const response = await fetch('https://api.akesomind.com/api/session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API error response:', errorData);
        throw new Error(`Failed to create session: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Session created:', result);
      
      // Show success message and reset form
      setSessionSuccess('Session created successfully!');
      resetSessionForm();
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsNewSessionModalOpen(false);
        setSessionSuccess(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error creating session:', error);
      setSessionError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const resetSessionForm = () => {
    setSessionTitle('');
    setSessionDate('');
    setSessionStartTime('09:00');
    setSessionEndTime('10:00');
    setSelectedClientId(null);
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
            <div className="flex gap-3">
              {isEditable && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={() => setIsNewSessionModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-success py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
              >
                New Session
              </button>
              <Link
                to="/sessions"
                className="inline-flex items-center justify-center rounded-full bg-info py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
              >
                View Sessions
              </Link>
            </div>
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

      <Modal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        title="Create New Session"
      >
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              New Therapy Session
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Schedule a new therapy session with your client
            </p>
          </div>

          {sessionSuccess && (
            <div className="mt-4 p-3 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400 rounded-md">
              {sessionSuccess}
            </div>
          )}

          {sessionError && (
            <div className="mt-4 p-3 bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400 rounded-md">
              {sessionError}
            </div>
          )}

          <div className="mt-6 space-y-6">
            {/* Session Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Session Title
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Enter session title"
              />
            </div>
            
            {/* Client Selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Select Client
              </label>
              {isLoadingClients ? (
                <div className="flex items-center justify-center h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              ) : clientsError ? (
                <div className="text-error-500 text-sm">{clientsError}</div>
              ) : (
                <select
                  value={selectedClientId || ""}
                  onChange={(e) => setSelectedClientId(Number(e.target.value) || null)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Session Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Session Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>

            {/* Session Time */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={sessionStartTime}
                    onChange={(e) => setSessionStartTime(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  End Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={sessionEndTime}
                    onChange={(e) => setSessionEndTime(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-8 modal-footer sm:justify-end">
            <button
              onClick={() => setIsNewSessionModalOpen(false)}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              disabled={isCreatingSession}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSession}
              type="button"
              className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 sm:w-auto disabled:bg-opacity-70 disabled:cursor-not-allowed"
              disabled={isCreatingSession}
            >
              {isCreatingSession ? (
                <span className="flex items-center">
                  <span className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Creating...
                </span>
              ) : (
                "Create Session"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TherapistProfileView; 