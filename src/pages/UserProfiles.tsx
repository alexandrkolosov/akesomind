import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PageBreadCrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserMaterialsCard from "../components/UserProfile/UserMaterialsCard";
// Import the development tools only if needed
import { ProfileTester } from "../components/Profile/ProfileTester";
import DevTester from "../components/Profile/DevTester";

export default function UserProfiles() {
  const { id } = useParams<{ id?: string }>();
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(id);

  // Safely check if we're in development environment
  const isDevelopment = typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development';

  useEffect(() => {
    console.log('UserProfiles: Component mounting with clientId:', id);

    // Check localStorage for user role/type and ID
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        console.log('UserProfiles: User data from localStorage:', {
          role: parsedData.role || 'Not set',
          type: parsedData.type || 'Not set',
          email: parsedData.email || 'Not set',
          id: parsedData.id || 'Not set'
        });
        
        // If we don't have an ID from URL params, try to get it from localStorage
        if (!id && parsedData.id) {
          setUserId(parsedData.id.toString());
          console.log(`UserProfiles: Setting userId from localStorage: ${parsedData.id}`);
        }
      } else {
        console.log('UserProfiles: No user data found in localStorage');
      }
    } catch (error) {
      console.error('UserProfiles: Error parsing user data from localStorage:', error);
    }

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log('UserProfiles: Component fully initialized and ready');
    }, 100); // Increased delay for more reliable initialization

    return () => {
      console.log('UserProfiles: Component unmounting');
      clearTimeout(timer);
    };
  }, [id]);

  if (!isReady) {
    console.log('UserProfiles: Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  console.log('UserProfiles: Rendering main content with userId:', userId);
  return (
    <>
      <PageMeta
        title="Profile"
        description="User profile information and settings"
      />
      <PageBreadCrumb pageTitle="Profile" />

      {/* Only show the ProfileTester in development mode */}
      {isDevelopment && (
        <div className="mb-6">
          <ProfileTester />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserInfoCard clientId={userId} />
        </div>
      </div>

      {/* Client Materials Section */}
      <div className="mt-6">
        <UserMaterialsCard clientId={userId} />
      </div>

      {/* Add the DevTester for development */}
      {isDevelopment && <DevTester />}
    </>
  );
}
