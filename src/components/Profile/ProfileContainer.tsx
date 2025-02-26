import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCurrentUserRole, UserRole } from '../../utils/rbac';
import { useOwnProfile, useClientProfile, ClientProfileData, TherapistProfileData } from '../../hooks/useProfileData';
import LoadingSpinner from '../common/LoadingSpinner';

// Use lazy loading for profile components
const ClientProfileView = React.lazy(() => import('./ClientProfileView'));
const TherapistProfileView = React.lazy(() => import('./TherapistProfileView'));

// Updated interface to include role
interface ProfileData {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  avatar?: string;
  role?: string;
  // Add other common fields as needed
}

// Loading component
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-6 flex items-center justify-center min-h-[200px]">
    <div className="text-center">
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Error</h3>
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  </div>
);

interface ProfileContainerProps {
  userRole?: 'Client' | 'Therapist';
  clientId?: string;
  userId?: string;
}

/**
 * ProfileContainer is the central component for determining which profile
 * view to show based on user role. It handles:
 * 1. Fetching the user role
 * 2. Fetching profile data
 * 3. Rendering the appropriate profile view
 */
const ProfileContainer: React.FC<ProfileContainerProps> = ({ userRole, clientId, userId }) => {
  console.log('ProfileContainer: Initializing with props:', { userRole, clientId, userId });
  
  const { id: paramUserId } = useParams<{ id?: string }>();
  const targetUserId = userId || clientId || paramUserId;
  const currentUserRole = getCurrentUserRole();
  const effectiveUserRole = userRole || currentUserRole;
  const [isReady, setIsReady] = useState(false);
  const componentMounted = useRef(true);
  
  console.log('ProfileContainer: User roles determined:', { 
    currentUserRole, 
    providedRole: userRole,
    effectiveUserRole,
    targetUserId
  });
  
  // Use this state to track if we've already tried loading for too long
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);
  
  useEffect(() => {
    console.log('ProfileContainer: Component mounting');
    
    // Add a small delay to ensure DOM is fully initialized
    const timer = setTimeout(() => {
      if (componentMounted.current) {
        setIsReady(true);
        console.log('ProfileContainer: Component is now ready after timeout');
      }
    }, 100); // Reduced timeout for faster response
    
    // Add a shorter fallback timer to force render
    const fallbackTimer = setTimeout(() => {
      if (componentMounted.current) {
        setTimeoutExceeded(true);
        console.log('ProfileContainer: Timeout exceeded, forcing render');
      }
    }, 1000); // Shorter timeout to avoid long waits
    
    return () => {
      console.log('ProfileContainer: Component unmounting');
      componentMounted.current = false;
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);
  
  const { loading: ownProfileLoading, error: ownProfileError, data: ownProfileData } = useOwnProfile();
  const { loading: clientProfileLoading, error: clientProfileError, data: clientProfileData } = useClientProfile(targetUserId || '');
  
  // Determine if we can proceed with rendering
  const isProfileDataReady = !ownProfileLoading && (!clientId || !clientProfileLoading);
  
  console.log('ProfileContainer: Profile data loading status:', {
    ownProfileLoading,
    clientProfileLoading, 
    hasOwnProfileData: !!ownProfileData,
    hasClientProfileData: !!clientProfileData,
    ownProfileError: ownProfileError?.message,
    clientProfileError: clientProfileError?.message,
    isReady,
    isProfileDataReady,
    timeoutExceeded
  });
  
  // If data is loaded but we're not "ready", force ready state
  useEffect(() => {
    if (isProfileDataReady && ownProfileData && !isReady && !timeoutExceeded) {
      console.log('ProfileContainer: Profile data ready but component not ready, forcing ready state');
      setIsReady(true);
    }
  }, [isProfileDataReady, ownProfileData, isReady, timeoutExceeded]);
  
  // Only show loading spinner if we're still loading data
  // No longer checking isReady since that might get stuck
  if (ownProfileLoading || (clientId && clientProfileLoading)) {
    console.log('ProfileContainer: Data still loading, showing loading spinner');
    return (
      <div className="p-6 flex justify-center items-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }
  
  console.log('ProfileContainer: Ready to render content');
  
  // If we have errors but we've exceeded the timeout, we'll try to render anyway with what we have
  if (ownProfileError && !timeoutExceeded) {
    console.error('ProfileContainer: Error loading own profile:', ownProfileError);
    return <ErrorDisplay message={ownProfileError.message || 'Error loading profile'} />;
  }
  
  if (clientId && clientProfileError && !timeoutExceeded) {
    console.error('ProfileContainer: Error loading client profile:', clientProfileError);
    return <ErrorDisplay message={clientProfileError.message || 'Error loading client profile'} />;
  }
  
  // If we're viewing someone else's profile
  if (clientId) {
    console.log('ProfileContainer: Viewing client profile with ID:', clientId);
    if (!clientProfileData && !timeoutExceeded) {
      console.error('ProfileContainer: Client profile data not found');
      return <ErrorDisplay message="Client profile not found" />;
    }

    console.log('ProfileContainer: Rendering client profile view for ID:', clientId);
    return (
      <div className="p-6">
        <React.Suspense fallback={<LoadingSpinner />}>
          <ClientProfileView 
            data={clientProfileData || {} as ClientProfileData} 
            isEditable={effectiveUserRole === 'Therapist'}
          />
        </React.Suspense>
      </div>
    );
  }
  
  // Viewing own profile - first validate we have data
  if (!ownProfileData && !timeoutExceeded) {
    console.error('ProfileContainer: Own profile data not found');
    return <ErrorDisplay message="Profile not found" />;
  }

  console.log('ProfileContainer: Viewing own profile with role:', effectiveUserRole);
  
  // Function to render the appropriate profile based on role
  const renderProfile = () => {
    console.log('ProfileContainer: Rendering profile for role:', effectiveUserRole);
    
    // Make sure we're using the profile data with correct role
    const profileDataWithRole = {
      ...ownProfileData,
      role: effectiveUserRole
    };
    
    switch (effectiveUserRole) {
      case 'Client': {
        console.log('ProfileContainer: Preparing client profile data');
        const clientData: ClientProfileData = {
          id: profileDataWithRole.id || '',
          email: profileDataWithRole.email || '',
          firstName: profileDataWithRole.firstName || '',
          lastName: profileDataWithRole.lastName || '',
          timezone: profileDataWithRole.timezone || '',
          avatar: profileDataWithRole.avatar,
          role: profileDataWithRole.role,
          birthday: (profileDataWithRole as Partial<ClientProfileData>).birthday || '',
          lastSession: (profileDataWithRole as Partial<ClientProfileData>).lastSession || '',
          phone: (profileDataWithRole as Partial<ClientProfileData>).phone || '',
        };

        console.log('ProfileContainer: Rendering ClientProfileView with data:', clientData);
        return (
          <ClientProfileView 
            data={clientData} 
            isEditable={true} 
          />
        );
      }
      case 'Therapist': {
        console.log('ProfileContainer: Preparing therapist profile data');
        const therapistData: TherapistProfileData = {
          id: profileDataWithRole.id,
          email: profileDataWithRole.email || '',
          firstName: profileDataWithRole.firstName || '',
          lastName: profileDataWithRole.lastName || '',
          timezone: profileDataWithRole.timezone || '',
          avatar: profileDataWithRole.avatar,
          role: profileDataWithRole.role,
          specialization: (profileDataWithRole as Partial<TherapistProfileData>).specialization || '',
          yearsOfExperience: (profileDataWithRole as Partial<TherapistProfileData>).yearsOfExperience || 0,
          certifications: (profileDataWithRole as Partial<TherapistProfileData>).certifications || [],
          education: (profileDataWithRole as Partial<TherapistProfileData>).education || '',
          languages: (profileDataWithRole as Partial<TherapistProfileData>).languages || [],
          bio: (profileDataWithRole as Partial<TherapistProfileData>).bio || '',
          phone: (profileDataWithRole as Partial<TherapistProfileData>).phone || '',
          availability: (profileDataWithRole as Partial<TherapistProfileData>).availability || {},
          rates: (profileDataWithRole as Partial<TherapistProfileData>).rates || {},
        };

        console.log('ProfileContainer: Rendering TherapistProfileView with data:', therapistData);
        return (
          <TherapistProfileView 
            data={therapistData}
            isEditable={true}
          />
        );
      }
      default:
        console.error('ProfileContainer: Invalid user role:', effectiveUserRole);
        return <ErrorDisplay message={`Invalid user role: ${effectiveUserRole}`} />;
    }
  };

  // Always return something - no matter if the role matches or not
  console.log('ProfileContainer: Rendering final profile content');
  return (
    <div className="p-6">
      <React.Suspense fallback={<LoadingSpinner />}>
        {renderProfile()}
      </React.Suspense>
    </div>
  );
};

export default ProfileContainer; 