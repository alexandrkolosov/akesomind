import React from 'react';
import { hasPermission, getCurrentUserRole, Permissions } from './index';

interface WithPermissionProps {
  requiredPermission: string;
  fallback?: React.ReactNode;
}

/**
 * Higher Order Component (HOC) that wraps components requiring specific permissions
 * @param WrappedComponent - The component to wrap
 * @param options - Configuration options
 * @returns A new component that checks permissions before rendering
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionProps
): React.FC<P> {
  const { requiredPermission, fallback = null } = options;
  
  // Return a functional component
  const WithPermissionComponent: React.FC<P> = (props: P) => {
    const userRole = getCurrentUserRole();
    
    if (hasPermission(userRole, requiredPermission)) {
      return <WrappedComponent {...props} />;
    }
    
    return <>{fallback}</>;
  };
  
  // Set display name for debugging
  const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithPermissionComponent.displayName = `withPermission(${wrappedComponentName})`;
  
  return WithPermissionComponent;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export const PermissionGate: React.FC<WithPermissionProps & { children: React.ReactNode }> = ({
  requiredPermission,
  fallback = null,
  children,
}) => {
  const userRole = getCurrentUserRole();
  
  if (hasPermission(userRole, requiredPermission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}; 