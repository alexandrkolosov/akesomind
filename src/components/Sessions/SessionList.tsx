import React, { useState } from 'react';
import { formatDate, formatTime } from '../../utils/dateUtils';

export interface Session {
  id: string;
  date?: string; // ISO date string - for client-side formatted data
  startTime?: string; // ISO date string - for client-side formatted data
  endTime?: string; // ISO date string - for client-side formatted data
  
  // Fields from actual API response
  startsAt?: string;
  durationMinutes?: number;
  completedAt?: string | null;
  status: 'completed' | 'upcoming' | 'cancelled' | 'OPEN_FOR_BOOKING' | 'COMPLETED' | string;
  notes?: string | { list: any[]; total: number };
  
  // Relationship data
  therapist?: { id: string | number; firstName?: string; lastName?: string };
  client?: { id: string | number; firstName?: string; lastName?: string };
  therapistId?: string;
  therapistName?: string;
  
  // Daily.co fields
  room?: {
    id: number;
    name: string;
    therapistId: number;
    dailyCoId: string;
    dailyCoUrl: string;
  };
  dailyCoUrl?: string;
  dailyCoClientToken?: string;
  dailyCoTherapistToken?: string;
  
  // Payment fields
  paymentLink?: string | null;
  costInCents?: number;
  currency?: string;
  isRecurring?: boolean;
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
  const isSessionStartingSoon = (session: Session) => {
    // Use either startsAt from the API or startTime from the client-side data
    const sessionStartTime = session.startsAt || session.startTime;
    if (!sessionStartTime) return false;
    
    // For sessions with date and startTime separately
    const sessionDateTime = new Date(sessionStartTime);
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
      let dailyCoUrl = '';
      let token = '';
      
      // Check where dailyCo information is stored based on API response
      if (sessionData.room && sessionData.room.dailyCoUrl) {
        // If room object contains the URL
        dailyCoUrl = sessionData.room.dailyCoUrl;
      } else if (sessionData.dailyCoUrl) {
        // Direct dailyCoUrl property
        dailyCoUrl = sessionData.dailyCoUrl;
      }
      
      if (!dailyCoUrl) {
        throw new Error("Daily.co URL not found in session data");
      }
      
      // Determine which token to use based on user type
      if (userType === 'client') {
        token = sessionData.dailyCoClientToken;
      } else {
        token = sessionData.dailyCoTherapistToken;
      }
      
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

  // Function to get formatted status text
  const getFormattedStatus = (status: string) => {
    if (status === 'OPEN_FOR_BOOKING') return 'upcoming';
    if (status === 'COMPLETED') return 'completed';
    if (status === 'CANCELLED') return 'cancelled';
    
    // If it's already in lowercase format, use it as is
    return status.toLowerCase();
  };

  // Function to render the status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    const formattedStatus = getFormattedStatus(status);
    let bgColor = '';
    let textColor = '';
    
    switch (formattedStatus) {
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
        {formattedStatus.charAt(0).toUpperCase() + formattedStatus.slice(1)}
      </span>
    );
  };
  
  // Function to get the session start time from different possible API formats
  const getSessionStart = (session: Session): Date | null => {
    if (session.startsAt) {
      return new Date(session.startsAt);
    }
    
    if (session.date && session.startTime) {
      return new Date(session.startTime);
    }
    
    return null;
  };
  
  // Function to get the session end time from different possible API formats
  const getSessionEnd = (session: Session): Date | null => {
    // If we have startsAt and durationMinutes, calculate end time
    if (session.startsAt && session.durationMinutes) {
      const start = new Date(session.startsAt);
      return new Date(start.getTime() + session.durationMinutes * 60 * 1000);
    }
    
    // If we have direct endTime
    if (session.endTime) {
      return new Date(session.endTime);
    }
    
    return null;
  };
  
  // Function to format session time for display
  const formatSessionTime = (session: Session): string => {
    const start = getSessionStart(session);
    const end = getSessionEnd(session);
    
    if (!start) return '-';
    
    if (end) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    }
    
    return formatTime(start);
  };
  
  // Function to format session date for display
  const formatSessionDate = (session: Session): string => {
    const start = getSessionStart(session);
    
    if (!start) return '-';
    
    return formatDate(start);
  };
  
  // Check if a session is upcoming
  const isUpcoming = (session: Session): boolean => {
    const status = getFormattedStatus(session.status);
    return status === 'upcoming';
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
                {formatSessionDate(session)}
              </p>
            </div>
            <div className="col-span-2 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
                {formatSessionTime(session)}
              </p>
            </div>
            <div className="col-span-2 flex items-center">
              {renderStatusBadge(session.status)}
            </div>
            <div className="col-span-2 flex items-center">
              {isUpcoming(session) && isSessionStartingSoon(session) ? (
                <button
                  className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-70 disabled:cursor-not-allowed"
                  onClick={() => handleJoinSession(session.id)}
                  disabled={isLoading[session.id]}
                >
                  {isLoading[session.id] ? 'Connecting...' : 'Enter Session'}
                </button>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isUpcoming(session) ? 'Available 5 min before start' : '-'}
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