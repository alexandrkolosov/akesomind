import React, { useState, useEffect } from 'react';
import { UserRole } from '../../utils/rbac';
import { setupTestUser, clearTestUser, getCurrentTestUser } from '../../utils/testHelpers';

/**
 * ProfileTester is a development-only component that allows switching between
 * different user roles for testing purposes.
 * 
 * In production, this component should be disabled or removed.
 */
export const ProfileTester: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  
  // Get the current role from localStorage on mount
  useEffect(() => {
    const userData = getCurrentTestUser();
    if (userData) {
      setCurrentRole(userData.role);
    }
  }, []);
  
  const handleRoleChange = (role: UserRole) => {
    setupTestUser(role);
    setCurrentRole(role);
    // Reload the page to apply changes
    window.location.reload();
  };
  
  const handleClearUser = () => {
    clearTestUser();
    setCurrentRole(null);
    // Reload the page to apply changes
    window.location.reload();
  };
  
  // Only render in development mode
  // Safely check if we're in development environment
  const isDevelopment = typeof process !== 'undefined' && 
    process.env && 
    process.env.NODE_ENV === 'development';
    
  if (!isDevelopment) {
    return null;
  }
  
  return (
    <div className="mb-4 rounded-sm border border-dashed border-warning bg-warning/10 p-4">
      <h3 className="mb-2 text-base font-medium text-warning">Profile Role Tester (Development Only)</h3>
      <p className="mb-3 text-sm">Current Role: {currentRole || 'None'}</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleRoleChange('Client')}
          className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
        >
          Set as Client
        </button>
        <button
          onClick={() => handleRoleChange('Therapist')}
          className="rounded-md bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
        >
          Set as Therapist
        </button>
        <button
          onClick={() => handleRoleChange('Admin')}
          className="rounded-md bg-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600"
        >
          Set as Admin
        </button>
        <button
          onClick={handleClearUser}
          className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
        >
          Clear User
        </button>
      </div>
    </div>
  );
}; 