import { useState, useEffect, useCallback } from 'react';
import { isAuthenticated } from '../utils/auth';
import { UserRole } from '../utils/rbac';

// Define types for profile data
export interface ProfileData {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  avatar?: string;
  role?: string;
  type?: string; // Some API responses use 'type' instead of 'role'
  // Add other common fields as needed
}

// Type for additional therapist-specific fields
export interface TherapistProfileData extends ProfileData {
  specialization: string;
  yearsOfExperience: number;
  certifications: string[];
  education: string;
  languages: string[];
  bio: string;
  phone: string;
  availability: Record<string, boolean>;
  rates: Record<string, number>;
  // Statistics fields
  activeClients?: number;
  sessionsThisMonth?: number;
  totalSessions?: number;
  // Add other therapist-specific fields as needed
}

// Type for additional client-specific fields
export interface ClientProfileData extends ProfileData {
  birthday?: string;
  lastSession?: string;
  phone?: string;
  // Client-specific fields only
}

interface ProfileHookResult {
  loading: boolean;
  error: Error | null;
  data: ProfileData | null;
  refetch: () => void;
}

/**
 * Helper function to determine user role from data
 */
function determineUserRole(data: any): string | undefined {
  // Check multiple possible fields that might contain role information
  if (data?.role && typeof data.role === 'string') {
    // If role exists, normalize casing
    if (data.role.toLowerCase() === 'therapist') return 'Therapist';
    if (data.role.toLowerCase() === 'client') return 'Client';
    return data.role;
  }
  
  // Try the 'type' field which some APIs use
  if (data?.type && typeof data.type === 'string') {
    // Normalize casing
    if (data.type.toLowerCase() === 'therapist') return 'Therapist';
    if (data.type.toLowerCase() === 'client') return 'Client';
    return data.type;
  }
  
  // Try localStorage as last resort
  try {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Check both 'role' and 'type' in localStorage
      if (parsedData.role) return parsedData.role;
      if (parsedData.type) return parsedData.type;
    }
  } catch (e) {
    console.warn('Error reading role/type from localStorage:', e);
  }
  
  return undefined;
}

/**
 * Hook for fetching the current user's profile data
 */
export function useOwnProfile(): ProfileHookResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ProfileData | null>(null);

  const fetchProfile = async () => {
    console.log('useOwnProfile: Starting to fetch profile data');
    setLoading(true);
    setError(null);
    
    try {
      // First verify authentication
      const isAuthed = await isAuthenticated();
      if (!isAuthed) {
        console.error('useOwnProfile: Not authenticated');
        throw new Error('Not authenticated');
      }
      
      console.log('useOwnProfile: Authentication verified, fetching user data');

      const response = await fetch('https://api.akesomind.com/api/user', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('useOwnProfile: Error fetching profile, status:', response.status);
        throw new Error(`Error fetching profile: ${response.statusText}`);
      }
      
      const profileData = await response.json();
      
      // Determine user role using our helper function
      const role = determineUserRole(profileData);
      if (role) {
        profileData.role = role;
        console.log('useOwnProfile: Role determined:', role);
      } else {
        console.log('useOwnProfile: Could not determine role - defaulting to Client');
        profileData.role = 'Client'; // Default role if not found
      }
      
      console.log('useOwnProfile: Profile data received:', {
        id: profileData?.id,
        email: profileData?.email,
        role: profileData?.role || 'Not set',
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
      });
      
      // Store the profile data in localStorage to ensure it's available for other components
      try {
        // Only update localStorage if we have valid data
        if (profileData && profileData.id) {
          const existingData = localStorage.getItem('userData');
          if (existingData) {
            // Update existing data with new values while preserving any fields that aren't in the profile
            const parsedExisting = JSON.parse(existingData);
            const mergedData = { ...parsedExisting, ...profileData };
            localStorage.setItem('userData', JSON.stringify(mergedData));
            console.log('useOwnProfile: Updated localStorage with merged profile data');
          } else {
            localStorage.setItem('userData', JSON.stringify(profileData));
            console.log('useOwnProfile: Stored profile data in localStorage');
          }
        }
      } catch (e) {
        console.warn('useOwnProfile: Error storing profile in localStorage:', e);
      }
      
      setData(profileData);
      console.log('useOwnProfile: Profile data set successfully with role:', profileData?.role || 'Not set');
    } catch (err) {
      console.error('useOwnProfile: Error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // If we failed to get profile data from the API but have localStorage data, use that as fallback
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData && parsedData.id) {
            console.log('useOwnProfile: Using localStorage data as fallback');
            setData(parsedData);
            setError(null); // Clear error since we have fallback data
          }
        }
      } catch (e) {
        console.error('useOwnProfile: Error using localStorage fallback:', e);
      }
    } finally {
      setLoading(false);
      console.log('useOwnProfile: Loading set to false');
    }
  };
  
  useEffect(() => {
    console.log('useOwnProfile: Effect running, fetching profile');
    fetchProfile();
  }, []);
  
  return { loading, error, data, refetch: fetchProfile };
}

/**
 * Hook for fetching a client's profile data
 */
export function useClientProfile(clientId: string): ProfileHookResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ClientProfileData | null>(null);

  const fetchClientProfile = useCallback(async () => {
    if (!clientId) {
      setError(new Error('Client ID is required'));
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Verify authentication
      if (!(await isAuthenticated())) {
        throw new Error('Not authenticated');
      }

      // Fetch the client profile data
      const response = await fetch(`https://api.akesomind.com/api/user/${clientId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching client profile: ${response.status} ${response.statusText}`);
      }
      
      // Process the response
      const profileData = await response.json();
      
      // Ensure consistent client role
      profileData.role = 'Client';
      
      setData(profileData as ClientProfileData);
    } catch (err) {
      console.error('useClientProfile: Error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  
  useEffect(() => {
    fetchClientProfile();
  }, [fetchClientProfile]);
  
  return { loading, error, data, refetch: fetchClientProfile };
} 