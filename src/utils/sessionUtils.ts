import { Session } from '../components/Sessions/SessionList';

/**
 * Maps API session status to UI status
 * @param apiStatus - Status string from the API
 * @returns Formatted status for UI
 */
export function mapSessionStatus(apiStatus: string): 'upcoming' | 'completed' | 'cancelled' | string {
  // Handle undefined or null status
  if (!apiStatus) return 'upcoming';
  
  // Normalize the status to uppercase for consistent mapping
  const normalizedStatus = apiStatus.toUpperCase();
  
  const statusMap: Record<string, string> = {
    'OPEN_FOR_BOOKING': 'upcoming',
    'PENDING_BY_CLIENT': 'upcoming', // Treat pending as upcoming for display purposes
    'PENDING': 'upcoming',
    'SCHEDULED': 'upcoming',
    'BOOKED': 'upcoming',
    'COMPLETED': 'completed',
    'FINISHED': 'completed',
    'CANCELLED': 'cancelled',
    'CANCELED': 'cancelled',
  };
  
  const mappedStatus = statusMap[normalizedStatus] || apiStatus.toLowerCase();
  console.log(`Mapping status: ${apiStatus} → ${mappedStatus}`);
  return mappedStatus;
}

/**
 * Calculates the end time of a session based on start time and duration
 * @param startTimeIso - ISO string of the start time
 * @param durationMinutes - Duration in minutes
 * @returns ISO string of the end time
 */
export function calculateEndTime(startTimeIso: string, durationMinutes: number): string {
  const startTime = new Date(startTimeIso);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  return endTime.toISOString();
}

/**
 * Transforms API session data to the format expected by our UI components
 * @param apiSession - Session data from the API
 * @returns Transformed session data for the UI
 */
export function transformApiSession(apiSession: any): Session {
  // Create base session object
  const session: Session = {
    id: apiSession.id.toString(),
    status: mapSessionStatus(apiSession.status || 'OPEN_FOR_BOOKING'),
  };
  
  // Transform dates
  if (apiSession.startsAt) {
    const startsAt = new Date(apiSession.startsAt);
    session.date = startsAt.toISOString().split('T')[0];
    session.startTime = apiSession.startsAt;
    
    // Calculate end time if duration is available
    if (apiSession.durationMinutes) {
      session.endTime = calculateEndTime(apiSession.startsAt, apiSession.durationMinutes);
    }
  }
  
  // Add therapist info if available
  if (apiSession.therapist) {
    session.therapistId = apiSession.therapist.id?.toString();
    
    // Use user property if available (nested structure) or direct properties
    const therapistUser = apiSession.therapist.user || apiSession.therapist;
    if (therapistUser.firstName && therapistUser.lastName) {
      session.therapistName = `${therapistUser.firstName} ${therapistUser.lastName}`;
    } else if (therapistUser.name) {
      session.therapistName = therapistUser.name;
    }
  }
  
  // Add notes - handle both note (singular) and notes (plural)
  if (apiSession.note) {
    session.notes = apiSession.note;
  } else if (apiSession.notes) {
    if (typeof apiSession.notes === 'string') {
      session.notes = apiSession.notes;
    } else if (apiSession.notes.list && Array.isArray(apiSession.notes.list) && apiSession.notes.list.length > 0) {
      // Extract the first note text from the list
      const firstNote = apiSession.notes.list[0];
      session.notes = firstNote.text || JSON.stringify(firstNote);
    }
  }
  
  // Add Daily.co information if available
  if (apiSession.room) {
    if (apiSession.room.dailyCoUrl) {
      session.dailyCoUrl = apiSession.room.dailyCoUrl;
    }
  }
  
  if (apiSession.dailyCoClientToken) {
    session.dailyCoClientToken = apiSession.dailyCoClientToken;
  }
  
  if (apiSession.dailyCoTherapistToken) {
    session.dailyCoTherapistToken = apiSession.dailyCoTherapistToken;
  }
  
  // Add console log to help debug
  console.log('Transformed session:', session);
  
  return session;
}

/**
 * Transforms a list of API sessions to UI format
 * @param apiSessions - List of sessions from the API
 * @returns Transformed session list for the UI
 */
export function transformApiSessionsList(apiSessions: any[]): Session[] {
  return apiSessions.map(transformApiSession);
}

/**
 * Parses API response to extract sessions list
 * @param apiResponse - API response data
 * @returns Array of sessions
 */
export function parseApiResponse(apiResponse: any): Session[] {
  console.log('Raw API response structure:', Object.keys(apiResponse));
  
  // Handle paginated response
  if (apiResponse.list && Array.isArray(apiResponse.list)) {
    console.log('Processing paginated response with', apiResponse.list.length, 'sessions');
    return transformApiSessionsList(apiResponse.list);
  } 
  
  // Handle direct array response
  if (Array.isArray(apiResponse)) {
    console.log('Processing array response with', apiResponse.length, 'sessions');
    return transformApiSessionsList(apiResponse);
  }
  
  // Handle page data wrapper (some APIs use this pattern)
  if (apiResponse.page && apiResponse.page.content && Array.isArray(apiResponse.page.content)) {
    console.log('Processing page.content response with', apiResponse.page.content.length, 'sessions');
    return transformApiSessionsList(apiResponse.page.content);
  }
  
  // If the data is a single session object
  if (apiResponse && apiResponse.id) {
    console.log('Processing single session response with ID:', apiResponse.id);
    return [transformApiSession(apiResponse)];
  }
  
  console.warn('Could not extract sessions from response:', apiResponse);
  return [];
} 