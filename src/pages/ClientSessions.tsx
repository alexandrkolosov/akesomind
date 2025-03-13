import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import SessionList, { Session } from '../components/Sessions/SessionList';
import { getCurrentUserRole } from '../utils/rbac';
import Modal from '../components/ui/Modal';
import { parseApiResponse } from '../utils/sessionUtils';

// Mock data for development - will be replaced with API calls
const mockSessions: Session[] = [
  {
    id: '1',
    date: '2025-03-13',
    startTime: '2025-03-13T14:00:00',
    endTime: '2025-03-13T15:00:00',
    status: 'upcoming',
    therapistName: 'Dr. Sarah Johnson'
  },
  {
    id: '2',
    date: '2025-03-13',
    startTime: '2025-03-13T16:30:00',
    endTime: '2025-03-13T17:30:00',
    status: 'upcoming',
    therapistName: 'Dr. Sarah Johnson'
  },
  {
    id: '3',
    date: '2025-03-13',
    startTime: '2025-03-13T10:00:00',
    endTime: '2025-03-13T11:00:00',
    status: 'upcoming',
    therapistName: 'Dr. Sarah Johnson'
  },
  {
    id: '4',
    date: '2023-07-15',
    startTime: '2023-07-15T14:00:00',
    endTime: '2023-07-15T15:00:00',
    status: 'completed',
    therapistName: 'Dr. Sarah Johnson'
  },
  {
    id: '5',
    date: '2023-07-22',
    startTime: '2023-07-22T14:00:00',
    endTime: '2023-07-22T15:00:00',
    status: 'completed',
    therapistName: 'Dr. Sarah Johnson'
  }
];

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

function ClientSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTherapist, setIsTherapist] = useState(false);
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

  // Function to fetch sessions from the API
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to fetch sessions from the API
      try {
        // Construct URL without date filtering initially
        const url = new URL('https://api.akesomind.com/api/session');
        
        // Filter by statuses we want to see
        url.searchParams.append('status[]', 'OPEN_FOR_BOOKING');
        url.searchParams.append('status[]', 'PENDING_BY_CLIENT');
        url.searchParams.append('status[]', 'PENDING');
        url.searchParams.append('status[]', 'SCHEDULED');
        url.searchParams.append('status[]', 'COMPLETED');
        
        // Add pagination parameters
        url.searchParams.append('limit', '100');
        url.searchParams.append('page', '1');
        
        console.log('Fetching sessions from:', url.toString());
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Sessions data:', data);
        console.log('Total sessions from API:', data.total || (data.list ? data.list.length : 'unknown'));
        
        // Transform API data using the utility function
        const transformedSessions = parseApiResponse(data);
        console.log('Transformed sessions:', transformedSessions);
        console.log('Number of transformed sessions:', transformedSessions.length);
        
        // Manually process session status based on dates
        const processedSessions = transformedSessions.map(session => {
          // Ensure startTime exists before creating a Date object
          if (session.startTime) {
            const sessionDate = new Date(session.startTime);
            const now = new Date();
            
            // If the session is in the past and not already completed, mark as completed
            if (sessionDate < now && session.status !== 'completed') {
              return { ...session, status: 'completed' };
            }
          }
          
          // If the session has status 'scheduled', change to 'upcoming'
          if (session.status === 'scheduled') {
            return { ...session, status: 'upcoming' };
          }
          
          return session;
        });
        
        // Set sessions with the transformed and processed data
        setSessions(processedSessions);
      } catch (error) {
        console.error('API Error:', error);
        
        // Fallback to mock data if API call fails
        console.log('Using mock data as fallback');
        setSessions(mockSessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is a therapist
    const userRole = getCurrentUserRole();
    setIsTherapist(userRole === 'Therapist');

    fetchSessions();
  }, []);

  useEffect(() => {
    // If the new session modal is opened, fetch clients
    if (isNewSessionModalOpen && isTherapist) {
      fetchClients();
    }
  }, [isNewSessionModalOpen, isTherapist]);

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
      
      // Directly add the new session to the sessions list
      if (result && result.id) {
        const newSession = {
          id: result.id.toString(),
          date: sessionDate,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: 'upcoming', // Force status to upcoming for immediate display
          therapistName: 'Your Therapist', // Default name if not available
          notes: sessionTitle
        };
        
        console.log('Adding new session directly to list:', newSession);
        // Add the new session at the beginning of the list
        setSessions(prevSessions => [newSession, ...prevSessions]);
      }
      
      // Show success message and reset form
      setSessionSuccess('Session created successfully!');
      resetSessionForm();
      
      // Close modal after a short delay and refresh sessions
      setTimeout(async () => {
        setIsNewSessionModalOpen(false);
        setSessionSuccess(null);
        
        // Refresh sessions list with specific filters for the new session
        try {
          // Create a special URL just to fetch this new session with its date
          const specialUrl = new URL('https://api.akesomind.com/api/session');
          
          // Use the newly created session's date for targeted filtering
          if (sessionDate) {
            specialUrl.searchParams.append('from', sessionDate);
            
            // Add a day to the sessionDate for 'to' parameter
            const nextDay = new Date(sessionDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];
            specialUrl.searchParams.append('to', nextDayStr);
          }
          
          // Filter by the status we just used
          specialUrl.searchParams.append('status[]', 'OPEN_FOR_BOOKING');
          
          console.log('Fetching newly created session from:', specialUrl.toString());
          
          const specialResponse = await fetch(specialUrl.toString(), {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            }
          });
          
          if (specialResponse.ok) {
            const specialData = await specialResponse.json();
            console.log('Special fetch response for new session:', specialData);
            
            // Now refresh all sessions
            fetchSessions();
          }
        } catch (error) {
          console.error('Error fetching new session details:', error);
          // Fallback to regular refresh
          fetchSessions();
        }
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
      <PageMeta
        title="Sessions | AkesoMind"
        description="View and manage your therapy sessions"
      />
      <PageBreadcrumb pageTitle="Sessions" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {isTherapist ? 'Therapy Sessions' : 'Your Therapy Sessions'}
            </h2>
            
            <div className="flex gap-2">
              {isTherapist && (
                <button
                  onClick={() => setIsNewSessionModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-6 text-sm font-medium text-white hover:bg-opacity-90"
                >
                  New Session
                </button>
              )}
              <button
                onClick={fetchSessions}
                className="inline-flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 py-2 px-6 text-sm font-medium text-gray-800 dark:text-white hover:bg-opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></span>
                    Refreshing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Upcoming Sessions
                </h3>
                <SessionList 
                  sessions={sessions
                    .filter(session => 
                      session.status === 'upcoming' || 
                      session.status === 'pending_by_client' ||
                      session.status === 'open_for_booking'
                    )
                    // Sort by date ascending (closest upcoming first)
                    .sort((a, b) => {
                      const dateA = a.startTime ? new Date(a.startTime).getTime() : a.date ? new Date(a.date).getTime() : 0;
                      const dateB = b.startTime ? new Date(b.startTime).getTime() : b.date ? new Date(b.date).getTime() : 0;
                      return dateA - dateB;
                    })
                  }
                  userType={isTherapist ? "therapist" : "client"}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Past Sessions
                </h3>
                <SessionList 
                  sessions={sessions
                    .filter(session => session.status === 'completed')
                    // Sort by date descending (most recent completed first)
                    .sort((a, b) => {
                      const dateA = a.startTime ? new Date(a.startTime).getTime() : a.date ? new Date(a.date).getTime() : 0;
                      const dateB = b.startTime ? new Date(b.startTime).getTime() : b.date ? new Date(b.date).getTime() : 0;
                      return dateB - dateA;
                    })
                    // Limit to 10 most recent completed sessions
                    .slice(0, 10)
                  }
                  userType={isTherapist ? "therapist" : "client"}
                />
              </div>
            </div>
          )}
        </div>
      </div>

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
}

export default ClientSessions; 