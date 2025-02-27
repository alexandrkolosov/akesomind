import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { verifyAuthentication } from './auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('ProtectedRoute: Checking authentication...');

      try {
        // Directly verify authentication using our updated logic
        const isVerified = await verifyAuthentication();
        console.log('ProtectedRoute: Authentication verification result:', isVerified);

        setAuthenticated(isVerified);
      } catch (error) {
        console.error('ProtectedRoute: Authentication check error:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);

        // Set a short timeout before setting ready state to ensure DOM is ready
        setTimeout(() => {
          setIsReady(true);
          console.log('ProtectedRoute: Component fully initialized and ready');
        }, 50);
      }
    };

    checkAuth();
  }, []);

  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login...');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: Authentication successful, rendering content');
  return <>{children}</>;
};

export default ProtectedRoute;