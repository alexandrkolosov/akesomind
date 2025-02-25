import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Try to fetch user profile as a way to check if user is authenticated
        const response = await fetch('https://api.akesomind.com/api/user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include cookies in the request
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Encode the body using URLSearchParams
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);

      const response = await fetch('https://api.akesomind.com/api/public/user/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include', // Include cookies in the request
        body: params.toString(),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        let errorMessage = 'Failed to sign in';

        if (response.status === 403) {
          errorMessage = 'Check your password or activate your account';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized: Please check your credentials.';
        } else {
          try {
            const data = await response.json();
            errorMessage = data.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use default error message
          }
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Call logout endpoint if your API has one
    fetch('https://api.akesomind.com/api/user/logout', {
      method: 'POST',
      credentials: 'include',
    })
        .then(() => {
          setIsAuthenticated(false);
          navigate('/signin');
        })
        .catch((err) => {
          console.error('Logout failed:', err);
          // Even if the API call fails, we should still log out locally
          setIsAuthenticated(false);
          navigate('/signin');
        });
  };

  return (
      <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, error }}>
        {children}
      </AuthContext.Provider>
  );
};