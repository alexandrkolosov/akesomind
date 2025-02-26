/**
 * Role-Based Access Control (RBAC) Utility
 * 
 * This module provides utilities for managing permissions based on user roles.
 * It defines permissions and role-to-permission mappings for the application.
 */

// Define all available permissions in the system
export const Permissions = {
  // Profile-related permissions
  VIEW_OWN_PROFILE: 'view-own-profile',
  EDIT_OWN_PROFILE: 'edit-own-profile',
  
  // Client-related permissions (typically for therapists)
  VIEW_CLIENT_PROFILES: 'view-client-profiles',
  EDIT_CLIENT_PROFILES: 'edit-client-profiles',
  INVITE_CLIENTS: 'invite-clients',
  
  // Specific feature permissions can be added as needed
  SCHEDULE_SESSIONS: 'schedule-sessions',
  VIEW_CALENDAR: 'view-calendar',
  
  // Admin permissions
  MANAGE_USERS: 'manage-users',
};

// Define valid role types
export type UserRole = 'Client' | 'Therapist' | 'Admin';

// Map roles to their allowed permissions
export const RolePermissions: Record<UserRole, string[]> = {
  'Client': [
    Permissions.VIEW_OWN_PROFILE,
    Permissions.EDIT_OWN_PROFILE,
    Permissions.VIEW_CALENDAR,
    Permissions.SCHEDULE_SESSIONS,
  ],
  'Therapist': [
    // Therapist can do everything a client can
    Permissions.VIEW_OWN_PROFILE,
    Permissions.EDIT_OWN_PROFILE,
    Permissions.VIEW_CALENDAR,
    Permissions.SCHEDULE_SESSIONS,
    
    // Plus therapist-specific permissions
    Permissions.VIEW_CLIENT_PROFILES,
    Permissions.EDIT_CLIENT_PROFILES,
    Permissions.INVITE_CLIENTS,
  ],
  'Admin': [
    // Admin has all permissions
    ...Object.values(Permissions),
  ],
};

// Default role if none is specified
export const DEFAULT_ROLE: UserRole = 'Client';

/**
 * Check if a user with the given role has a specific permission
 * @param userRole - The role of the user
 * @param permission - The permission to check
 * @returns True if the user has the permission, false otherwise
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = RolePermissions[userRole as UserRole] || [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a given role
 * @param role - The role to get permissions for
 * @returns Array of permission strings
 */
export function getPermissionsForRole(role: string): string[] {
  return RolePermissions[role as UserRole] || [];
}

/**
 * Check if a user with given role can access a specific feature
 * This is a convenience wrapper around hasPermission for component usage
 * @param userRole - The role of the user
 * @param requiredPermission - The permission required for the feature
 * @returns True if access is allowed, false otherwise
 */
export function canAccess(userRole: string, requiredPermission: string): boolean {
  return hasPermission(userRole, requiredPermission);
}

// Hook into the application's authentication system
// Gets the current user's role from localStorage or a default
export function getCurrentUserRole(): UserRole {
  console.log('RBAC: Getting current user role');
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('RBAC: User data from localStorage:', {
        role: parsedData.role || 'Not set',
        email: parsedData.email || 'Not set'
      });
      
      // Verify this is a valid role
      if (parsedData.role && Object.keys(RolePermissions).includes(parsedData.role)) {
        console.log('RBAC: Using valid role from localStorage:', parsedData.role);
        
        // Special case for Therapist - enforce correct casing
        if (parsedData.role.toLowerCase() === 'therapist') {
          console.log('RBAC: Found therapist role, ensuring correct casing');
          return 'Therapist';
        }
        
        return parsedData.role as UserRole;
      } else {
        console.warn('RBAC: Invalid or missing role in localStorage:', parsedData.role);
      }
    } else {
      console.log('RBAC: No user data found in localStorage');
    }
  } catch (error) {
    console.error('RBAC: Error getting user role:', error);
  }
  
  console.log('RBAC: Using default role:', DEFAULT_ROLE);
  return DEFAULT_ROLE;
} 