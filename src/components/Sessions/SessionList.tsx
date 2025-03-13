import React, { useState } from 'react';
import { formatDate, formatTime } from '../../utils/dateUtils';

export interface Session {
  id: string;
  date: string; // ISO date string
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  status: 'completed' | 'upcoming' | 'cancelled';
  notes?: string;
  therapistId?: string;
  therapistName?: string;
  // Daily.co fields
  dailyCoUrl?: string;
  dailyCoClientToken?: string;
  dailyCoTherapistToken?: string;
}

interface SessionListProps {
  sessions: Session[];
  userType: 'client' | 'therapist';
}

function SessionList({ sessions, userType }: SessionListProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Get current time for comparison
  const now = new Date();
  
  // Check if a session is within 5 minutes of starting
  const isSessionStartingSoon = (sessionDate: string, startTime: string) => {
    const sessionDateTime = new Date(`${sessionDate}T${startTime}`);
    const fiveMinutesBeforeStart = new Date(sessionDateTime.getTime() - 5 * 60 * 1000);
    return now >= fiveMinutesBeforeStart && now < sessionDateTime;
  };

  // Function to fetch session details and join
  const handleJoinSession = async (sessionId: string) => {
    setIsLoading(prev => ({ ...prev, [sessionId]: true }));
    setError(null);
    
    try {
      // Fetch session details using the provided endpoint
      const response = await fetch(`https://api.akesomind.com/api/session/${sessionId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch session details: ${response.status}`);
      }
      
      const sessionData = await response.json();
      console.log("Session data:", sessionData);
      
      // Extract Daily.co information
      const { dailyCoUrl, dailyCoClientToken, dailyCoTherapistToken } = sessionData;
      
      if (!dailyCoUrl) {
        throw new Error("Daily.co URL not found in session data");
      }
      
      // Determine which token to use based on user type
      const token = userType === 'client' ? dailyCoClientToken : dailyCoTherapistToken;
      
      if (!token) {
        throw new Error(`${userType} token not found in session data`);
      }
      
      // Redirect to Daily.co session
      window.open(`${dailyCoUrl}?t=${token}`, '_blank');
    } catch (error) {
      console.error("Error joining session:", error);
      setError(error instanceof Error ? error.message : 'Failed to join session');
    } finally {
      setIsLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // Function to render the status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'completed':
        bgColor = 'bg-success-50 dark:bg-success-500/15';
        textColor = 'text-success-700 dark:text-success-400';
        break;
      case 'upcoming':
        bgColor = 'bg-warning-50 dark:bg-warning-500/15';
        textColor = 'text-warning-700 dark:text-orange-400';
        break;
      case 'cancelled':
        bgColor = 'bg-danger-50 dark:bg-danger-500/15';
        textColor = 'text-danger-700 dark:text-danger-400';
        break;
      default:
        bgColor = 'bg-gray-100 dark:bg-gray-500/15';
        textColor = 'text-gray-700 dark:text-gray-400';
    }
    
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Your Sessions
        </h4>
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Date</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Time</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Status</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Action</p>
        </div>
      </div>

      {sessions && sessions.length > 0 ? (
        sessions.map((session) => (
          <div
            key={session.id}
            className="grid grid-cols-6 border-t border-stroke py-4.5 px-4 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          >
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {formatDate(session.date)}
              </p>
            </div>
            <div className="col-span-2 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
                {formatTime(session.startTime)} - {formatTime(session.endTime)}
              </p>
            </div>
            <div className="col-span-2 flex items-center">
              {renderStatusBadge(session.status)}
            </div>
            <div className="col-span-2 flex items-center">
              {session.status === 'upcoming' && isSessionStartingSoon(session.date, session.startTime) ? (
                <button
                  className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-70 disabled:cursor-not-allowed"
                  onClick={() => handleJoinSession(session.id)}
                  disabled={isLoading[session.id]}
                >
                  {isLoading[session.id] ? 'Connecting...' : 'Enter Session'}
                </button>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {session.status === 'upcoming' ? 'Available 5 min before start' : '-'}
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="border-t border-stroke py-8 px-4 dark:border-strokedark md:px-6 2xl:px-7.5">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            No sessions found
          </p>
        </div>
      )}
    </div>
  );
}

export default SessionList; 