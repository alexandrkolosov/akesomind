import React, { useState, useEffect } from 'react';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import PageMeta from '../components/common/PageMeta';
import SessionList, { Session } from '../components/Sessions/SessionList';

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

function ClientSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch from the API endpoint
        /*
        const response = await fetch('https://api.akesomind.com/api/session', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }
        
        const data = await response.json();
        setSessions(data.list || data);
        */
        
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setSessions(mockSessions);
        setError(null);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <>
      <PageMeta
        title="Sessions | AkesoMind"
        description="View and manage your therapy sessions"
      />
      <PageBreadcrumb pageTitle="Sessions" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-4 md:p-6 lg:p-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            Your Therapy Sessions
          </h2>
          
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
                  sessions={sessions.filter(session => session.status === 'upcoming')}
                  userType="client"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Past Sessions
                </h3>
                <SessionList 
                  sessions={sessions.filter(session => session.status === 'completed')}
                  userType="client"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ClientSessions; 