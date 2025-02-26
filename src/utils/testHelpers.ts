/**
 * Test Helper Utilities
 * 
 * This file contains helper functions for testing the application,
 * particularly for simulating different user roles.
 */

import { UserRole } from './rbac';

interface TestUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  timezone?: string;
  avatar?: string;
  specialization?: string;
  yearsOfExperience?: number;
  certifications?: string[];
}

// Mock data for a client user
const mockClientData: TestUserData = {
  id: 'client-123',
  email: 'client@example.com',
  firstName: 'Test',
  lastName: 'Client',
  role: 'Client',
  timezone: 'America/New_York'
};

// Mock data for a therapist user
const mockTherapistData: TestUserData = {
  id: 'therapist-456',
  email: 'therapist@example.com',
  firstName: 'Test',
  lastName: 'Therapist',
  role: 'Therapist',
  timezone: 'America/Los_Angeles',
  specialization: 'Cognitive Behavioral Therapy',
  yearsOfExperience: 5,
  certifications: ['Licensed Clinical Social Worker', 'Certified Trauma Professional']
};

// Mock data for an admin user
const mockAdminData: TestUserData = {
  id: 'admin-789',
  email: 'admin@example.com',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'Admin',
  timezone: 'UTC'
};

/**
 * Sets up a test user in localStorage with the specified role
 * @param role - The user role to simulate
 */
export function setupTestUser(role: UserRole): void {
  let userData: TestUserData;
  
  switch (role) {
    case 'Client':
      userData = mockClientData;
      break;
    case 'Therapist':
      userData = mockTherapistData;
      break;
    case 'Admin':
      userData = mockAdminData;
      break;
    default:
      userData = mockClientData;
  }
  
  // Set up the user data in localStorage
  localStorage.setItem('userData', JSON.stringify(userData));
  localStorage.setItem('token', 'fake-jwt-token-for-testing');
  
  console.log(`✅ Test user set up with role: ${role}`);
  console.log('User data:', userData);
}

/**
 * Clears all test user data from localStorage
 */
export function clearTestUser(): void {
  localStorage.removeItem('userData');
  localStorage.removeItem('token');
  
  console.log('🗑️ Test user data cleared');
}

/**
 * Gets the current test user data from localStorage
 */
export function getCurrentTestUser(): TestUserData | null {
  const userDataStr = localStorage.getItem('userData');
  
  if (!userDataStr) {
    console.log('❌ No test user found in localStorage');
    return null;
  }
  
  try {
    const userData = JSON.parse(userDataStr);
    console.log('Current test user:', userData);
    return userData;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
} 