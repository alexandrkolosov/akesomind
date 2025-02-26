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
  // Add other client-specific fields as needed
}

interface ProfileHookResult {
  loading: boolean;
  error: Error | null;
  data: ProfileData | null;
  refetch: () => void;
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
      console.log('useOwnProfile: Profile data received:', {
        id: profileData?.id,
        email: profileData?.email,
        role: profileData?.role || 'Not set',
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
      });
      
      // Special handling for role
      // If role is present but casing is wrong for "Therapist", fix it
      if (profileData?.role && typeof profileData.role === 'string' && 
          profileData.role.toLowerCase() === 'therapist' && profileData.role !== 'Therapist') {
        console.log('useOwnProfile: Correcting therapist role casing');
        profileData.role = 'Therapist';
      }
      
      // If no role in profile data but exists in localStorage, use that
      if (!profileData?.role) {
        console.warn('useOwnProfile: No role in profile data, checking localStorage');
        try {
          const storedData = localStorage.getItem('userData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.role) {
              console.log('useOwnProfile: Using role from localStorage:', parsedData.role);
              profileData.role = parsedData.role;
            }
          }
        } catch (e) {
          console.error('useOwnProfile: Error getting role from localStorage:', e);
        }
      }
      
      setData(profileData);
      console.log('useOwnProfile: Profile data set successfully with role:', profileData?.role || 'Not set');
    } catch (err) {
      console.error('useOwnProfile: Error:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
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
      // First verify authentication
      const isAuthed = await isAuthenticated();
      if (!isAuthed) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`https://api.akesomind.com/api/user/${clientId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching client profile: ${response.statusText}`);
      }
      
      const profileData = await response.json();
      setData(profileData as ClientProfileData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);
  
  useEffect(() => {
    fetchClientProfile();
  }, [clientId]);
  
  return { loading, error, data, refetch: fetchClientProfile };
} 