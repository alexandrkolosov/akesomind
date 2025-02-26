import React, { useEffect } from 'react';

/**
 * DevTester is a development-only component that loads the test utilities
 * to help with testing the role-based profile implementation.
 * 
 * This component should never be included in production builds.
 */
const DevTester: React.FC = () => {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV === 'development') {
      // Load the test script
      const script = document.createElement('script');
      script.src = '/src/utils/test-profile.js';
      script.async = true;
      script.id = 'profile-test-script';
      
      // Add the script to the document
      document.body.appendChild(script);
      
      // Clean up on unmount
      return () => {
        const existingScript = document.getElementById('profile-test-script');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, []);
  
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-boxdark p-4 rounded-lg shadow-lg border border-warning">
      <h4 className="text-sm font-semibold mb-2">Development Test Tools</h4>
      <p className="text-xs text-meta-5 mb-3">
        Open your browser console (F12) and use these commands:
      </p>
      <ul className="text-xs space-y-1 text-body">
        <li><code>setupTestClient()</code> - Set up a test client</li>
        <li><code>setupTestTherapist()</code> - Set up a test therapist</li>
        <li><code>clearTestUser()</code> - Clear test user</li>
        <li><code>checkCurrentUser()</code> - Check current user</li>
      </ul>
    </div>
  );
};

export default DevTester; 