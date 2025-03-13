/**
 * Authentication utility functions using HTTP-only cookies for session management
 */

// Check if user is authenticated by verifying with the server
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://api.akesomind.com/api/user', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};

// Get user data from the server
export const getUserData = async (): Promise<any> => {
  try {
    console.log('Auth: Fetching user data from server');
    const response = await fetch('https://api.akesomind.com/api/user', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Auth: Failed to get user data, status:', response.status);
      throw new Error('Failed to get user data');
    }

    const userData = await response.json();
    console.log('Auth: User data received from server:', {
      id: userData.id,
      email: userData.email,
      role: userData.role || 'Not set',
      firstName: userData.firstName,
      lastName: userData.lastName
    });

    // Ensure the role is properly set
    if (!userData.role && !userData.type) {
      console.warn('Auth: User role/type not set in API response, checking localStorage');
      // Try to get role/type from localStorage if it exists
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.type) {
            console.log('Auth: Using type from localStorage:', parsedData.type);
            userData.type = parsedData.type;
            userData.role = parsedData.type; // Set role for backward compatibility
          } else if (parsedData.role) {
            console.log('Auth: Using role from localStorage:', parsedData.role);
            userData.role = parsedData.role;
          }
        }
      } catch (e) {
        console.error('Auth: Error getting role/type from localStorage:', e);
      }
    }

    return userData;
  } catch (error) {
    console.error('Auth: Error getting user data:', error);
    return null;
  }
};

// Verify authentication with the server
export const verifyAuthentication = async (): Promise<boolean> => {
  return isAuthenticated();
};

// Login function
export const login = async (email: string, password: string) => {
  try {
    console.log('Auth: Attempting login with email:', email);

    // Create URLSearchParams for x-www-form-urlencoded format
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('password', password);

    const response = await fetch('https://api.akesomind.com/api/public/user/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include', // Important for cookies
      body: params.toString(),
    });

    console.log('Auth: Login response status:', response.status);

    if (!response.ok) {
      // Handle 401 errors (unauthorized) - could be unverified email
      if (response.status === 401) {
        // Check for content before trying to parse JSON
        const text = await response.text();
        if (!text) {
          console.log('Auth: Empty response body with 401 status - likely unverified email');
          return {
            success: false,
            error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
            unverifiedEmail: true
          };
        }

        // If there's content, try to parse as JSON
        try {
          const error = JSON.parse(text);
          return { success: false, error: error.message || 'Authentication failed' };
        } catch (e) {
          // If parsing fails, return a generic message
          return { success: false, error: 'Authentication failed' };
        }
      }

      // For non-401 errors, attempt to parse JSON as before
      try {
        const error = await response.json();
        return { success: false, error: error.message || 'Login failed' };
      } catch (e) {
        // If parsing fails, return status code message
        return { success: false, error: `Login failed (${response.status})` };
      }
    }

    const userData = await response.json();
    console.log('Auth: Login successful, received user data');

    // Log information about the role/type
    console.log('Auth: User data from login response:', {
      id: userData.id || 'Not set',
      email: userData.email || 'Not set',
      role: userData.role || 'Not set',
      type: userData.type || 'Not set'
    });

    // Ensure the role is properly set if it exists in the API response
    // Check for 'type' field first, which is the new field name
    if (userData.type) {
      console.log('Auth: Using type from API response:', userData.type);
      // Ensure we also set role for backward compatibility
      userData.role = userData.type;
    } else if (userData.role) {
      console.log('Auth: Confirmed user role:', userData.role);
      // Convert therapist role to proper casing if needed
      if (typeof userData.role === 'string' && userData.role.toLowerCase() === 'therapist') {
        console.log('Auth: Converting therapist role to correct casing');
        userData.role = 'Therapist';
      }
    } else {
      console.warn('Auth: User role/type not set in login response');
    }

    // Store both role and type in localStorage if available
    const userDataToStore = {
      ...userData,
      // Ensure we have both fields set if either is present
      role: userData.role || userData.type || 'Client',
      type: userData.type || userData.role || 'Client',
    };

    // Store in localStorage
    localStorage.setItem('userData', JSON.stringify(userDataToStore));

    return { success: true, userData };
  } catch (error) {
    console.error('Auth: Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    // Note: The /api/user/logout endpoint is not used in this implementation
    // We're just clearing local storage and redirecting to sign in page
    
    // Clear localStorage
    localStorage.removeItem('userData');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Redirect to signin page
    window.location.href = '/signin';
  }
};

// Handle API responses with potential 401 errors
export const handleApiResponse = async (response: Response): Promise<any> => {
  console.log('Handling API response with status:', response.status);

  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else if (contentType && contentType.includes('text/')) {
      return response.text();
    } else {
      // For other content types, just return an empty object
      return {};
    }
  } else if (response.status === 401) {
    // If unauthorized, but we have user data, we'll try to continue the session
    const userData = await getUserData();
    if (userData && userData.id && response.url !== 'https://api.akesomind.com/api/user') {
      console.log('401 error, but we have user data and this is not the verification endpoint');
      console.log('Continuing session with stored user data');
      return userData;
    }

    // Otherwise, clear auth state
    localStorage.removeItem('userData');

    // Try to get error message from response
    let errorMessage = 'Your session has expired. Please log in again.';
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      }
    } catch (e) {
      // If parsing fails, use default error message
    }

    console.log('401 Unauthorized error:', errorMessage);

    // Redirect to login page
    window.location.href = '/signin';
    throw new Error(errorMessage);
  } else {
    // Handle other errors
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else if (contentType && contentType.includes('text/')) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
    } catch (e) {
      // If parsing fails, use default error message
    }

    console.log('API error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Simplified fetch wrapper with better error handling
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Special handling for therapist/clients endpoint
  if (url.includes('/api/therapist/clients')) {
    try {
      console.log(`Making authenticated request to: ${url}`);

      // First, try the GET request with query parameters
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      console.log(`Response status for ${url}: ${response.status}`);

      // If successful, parse and return the response
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }
      }

      // If we get a 401, try a POST request with parameters in the body
      if (response.status === 401) {
        console.log('GET request failed with 401, trying POST request...');

        // Parse the URL to extract query parameters
        const urlObj = new URL(url);
        const state = urlObj.searchParams.get('state') || 'all';

        // Extract pageRequest parameters
        let offset = 0;
        let limit = 10;

        // Try to extract from bracket notation
        const offsetParam = urlObj.searchParams.get('pageRequest[offset]');
        const limitParam = urlObj.searchParams.get('pageRequest[limit]');

        if (offsetParam) offset = parseInt(offsetParam);
        if (limitParam) limit = parseInt(limitParam);

        // If not found, try to extract from JSON string
        if (!offsetParam && !limitParam) {
          const pageRequestJson = urlObj.searchParams.get('pageRequest');
          if (pageRequestJson) {
            try {
              const pageRequest = JSON.parse(pageRequestJson);
              offset = pageRequest.offset || 0;
              limit = pageRequest.limit || 10;
            } catch (e) {
              console.log('Error parsing pageRequest JSON:', e);
            }
          }
        }

        // Create the POST request body with proper typing
        interface ClientRequestBody {
          state: string;
          pageRequest: { offset: number; limit: number };
          name?: string; // Optional name property
        }

        const postBody: ClientRequestBody = {
          state,
          pageRequest: { offset, limit }
        };

        // Add name parameter if present
        const name = urlObj.searchParams.get('name');
        if (name) {
          postBody.name = name;
        }

        console.log('Trying POST request with body:', postBody);

        // Make the POST request
        const postResponse = await fetch('https://api.akesomind.com/api/therapist/clients', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postBody)
        });

        console.log(`POST response status: ${postResponse.status}`);

        if (postResponse.ok) {
          const contentType = postResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await postResponse.json();
          } else {
            return await postResponse.text();
          }
        }

        // If POST also fails, return empty data
        console.log('Both GET and POST requests failed, returning empty data');
        return { list: [], total: 0 };
      }

      // For other error statuses, return empty data
      return { list: [], total: 0 };
    } catch (error) {
      console.log('Error fetching clients:', error);
      return { list: [], total: 0 };
    }
  }

  // Special handling for user profile PUT request
  if (url === 'https://api.akesomind.com/api/user' && options.method === 'PUT') {
    try {
      console.log('Making PUT request to update user profile');

      // Log the request body for debugging
      let bodyObj: any = {};
      let originalBody = "";

      if (options.body) {
        try {
          originalBody = options.body.toString();
          bodyObj = JSON.parse(originalBody);
          console.log('Original request body:', JSON.stringify(bodyObj, null, 2));

          // Always ensure the body format is correct for the backend
          let needsModification = false;
          const modifiedBody = { ...bodyObj };

          // Process each field according to the backend requirements

          // ===== Handle zoneId =====
          // The backend expects a string value that will be passed to ZoneId.of(zoneId)
          if (typeof bodyObj.zoneId === 'object' && bodyObj.zoneId !== null) {
            // If it's an object with an id field, extract the id
            if (bodyObj.zoneId.id) {
              console.log(`Converting zoneId object to string: { id: "${bodyObj.zoneId.id}" } → "${bodyObj.zoneId.id}"`);
              modifiedBody.zoneId = bodyObj.zoneId.id;
              needsModification = true;
            } else {
              console.warn('WARNING: zoneId is an object without id property. Using default "UTC"');
              modifiedBody.zoneId = "UTC";
              needsModification = true;
            }
          } else if (bodyObj.zoneId === null || bodyObj.zoneId === undefined) {
            console.warn('WARNING: zoneId is null or undefined. Setting default "UTC" value.');
            modifiedBody.zoneId = "UTC";
            needsModification = true;
          } else if (typeof bodyObj.zoneId === 'string') {
            if (bodyObj.zoneId.trim() === "") {
              console.warn('WARNING: zoneId is an empty string. Setting default "UTC" value.');
              modifiedBody.zoneId = "UTC";
              needsModification = true;
            } else {
              console.log('zoneId is correctly formatted as a string:', bodyObj.zoneId);
            }
          } else {
            console.warn(`WARNING: zoneId has unexpected type: ${typeof bodyObj.zoneId}. Using default "UTC"`);
            modifiedBody.zoneId = "UTC";
            needsModification = true;
          }

          // ===== Handle boolean fields =====
          // Ensure darkTheme and muteNotifications are actual booleans
          if ('darkTheme' in bodyObj && typeof bodyObj.darkTheme !== 'boolean') {
            console.warn(`WARNING: darkTheme is not a boolean: ${bodyObj.darkTheme}`);
            modifiedBody.darkTheme = Boolean(bodyObj.darkTheme);
            needsModification = true;
          }

          if ('muteNotifications' in bodyObj && typeof bodyObj.muteNotifications !== 'boolean') {
            console.warn(`WARNING: muteNotifications is not a boolean: ${bodyObj.muteNotifications}`);
            modifiedBody.muteNotifications = Boolean(bodyObj.muteNotifications);
            needsModification = true;
          }

          // ===== Handle birthday =====
          // Ensure birthday is a valid string or null
          if (bodyObj.birthday !== null && bodyObj.birthday !== undefined) {
            if (typeof bodyObj.birthday !== 'string') {
              console.warn(`WARNING: birthday is not a string: ${bodyObj.birthday}`);
              modifiedBody.birthday = null;
              needsModification = true;
            } else if (!bodyObj.birthday.match(/^\d{4}-\d{2}-\d{2}T/)) {
              console.warn(`WARNING: birthday is not a valid ISO string: ${bodyObj.birthday}`);
              try {
                const date = new Date(bodyObj.birthday);
                if (!isNaN(date.getTime())) {
                  modifiedBody.birthday = date.toISOString();
                  console.log(`Converted birthday to ISO string: ${modifiedBody.birthday}`);
                } else {
                  modifiedBody.birthday = null;
                }
                needsModification = true;
              } catch (e) {
                console.warn('Failed to parse birthday, setting to null');
                modifiedBody.birthday = null;
                needsModification = true;
              }
            }
          }

          // ===== Handle photoId =====
          // Ensure photoId is a number or null
          if (bodyObj.photoId !== null && bodyObj.photoId !== undefined) {
            if (typeof bodyObj.photoId !== 'number') {
              console.warn(`WARNING: photoId is not a number: ${bodyObj.photoId}`);
              // Try to convert to number or set to null
              const photoIdNum = parseInt(String(bodyObj.photoId));
              modifiedBody.photoId = isNaN(photoIdNum) ? null : photoIdNum;
              needsModification = true;
            }
          }

          // ===== Apply modifications if needed =====
          if (needsModification) {
            console.log('Modified request body:', JSON.stringify(modifiedBody, null, 2));
            options.body = JSON.stringify(modifiedBody);
          } else {
            console.log('Request body is properly formatted, no modifications needed');
          }

          // ===== Final validation =====
          // Ensure all fields from UpdateUser class are present
          const requiredFields = [
            'email', 'firstName', 'lastName', 'darkTheme', 'language',
            'muteNotifications', 'phone', 'birthday', 'education',
            'experience', 'approach', 'photoId', 'zoneId'
          ];

          const finalBodyObj = needsModification ? modifiedBody : bodyObj;
          const missingFields = requiredFields.filter(field => !(field in finalBodyObj));

          if (missingFields.length > 0) {
            console.warn('WARNING: Missing fields in request body:', missingFields.join(', '));
          }

          // Log the final request body as string
          console.log('Final request body string:', options.body);
        } catch (e) {
          console.error('Error parsing request body for validation:', e);
          // If we can't parse the body, we'll send it as-is and let the server handle errors
          console.log('Proceeding with unmodified body:', originalBody);
        }
      }

      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        }
      });

      console.log(`PUT response status: ${response.status}`);

      // Log the actual request details that were sent to the server
      console.log('Request details that were sent:');
      console.log('- URL:', url);
      console.log('- Method:', options.method);
      console.log('- Headers:', JSON.stringify(options.headers, null, 2));
      console.log('- Body:', options.body);

      if (!response.ok) {
        // Get detailed error information
        let errorMessage = `Failed to update profile (${response.status})`;
        let errorData = null;

        try {
          // One last attempt - try with a completely reconstructed minimal request
          console.log('Attempting another approach with minimal data...');

          try {
            const minimalData = {
              firstName: bodyObj.firstName,
              lastName: bodyObj.lastName,
              email: bodyObj.email,
              // The critical field - plain string for zoneId
              zoneId: typeof bodyObj.zoneId === 'string' ? bodyObj.zoneId :
                (typeof bodyObj.zoneId === 'object' && bodyObj.zoneId?.id ? bodyObj.zoneId.id : "UTC"),
              // Default values for required fields
              darkTheme: false,
              muteNotifications: false,
              language: "EN",
              phone: null,
              birthday: null,
              education: null,
              experience: null,
              approach: null,
              photoId: null
            };

            console.log('Trying with minimal data:', JSON.stringify(minimalData, null, 2));

            const retryResponse = await fetch(url, {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(minimalData)
            });

            console.log('Retry response status:', retryResponse.status);

            if (retryResponse.ok) {
              console.log('Retry with minimal data succeeded!');
              const data = await retryResponse.json();

              // Update local storage with new user data if this is the current user's profile
              const userData = await getUserData();
              if (userData && userData.id === data.id) {
                localStorage.setItem('userData', JSON.stringify({
                  ...userData,
                  ...data
                }));
              }

              return data;
            } else {
              console.log('Retry with minimal data failed, proceeding with error handling');
            }
          } catch (retryError) {
            console.error('Error during retry attempt:', retryError);
          }

          // Log all response headers for debugging
          console.error('Response headers:');
          response.headers.forEach((value, name) => {
            console.error(`  ${name}: ${value}`);
          });

          const contentType = response.headers.get('content-type');
          console.log('Response content type:', contentType);

          const errorText = await response.text();
          console.error('Profile update error text:', errorText);

          // Try to parse the error text as JSON regardless of content type
          try {
            const parsedError = JSON.parse(errorText);
            console.error('Parsed error from text:', parsedError);
            errorMessage = JSON.stringify(parsedError);
          } catch (parseError) {
            // Use the raw text if it can't be parsed
            errorMessage = errorText || errorMessage;
            console.log('Could not parse error as JSON, using raw text');
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Successful update response:', data);

        // Update local storage with new user data if this is the current user's profile
        const userData = await getUserData();
        if (userData && userData.id === data.id) {
          localStorage.setItem('userData', JSON.stringify({
            ...userData,
            ...data
          }));
        }

        return data;
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error; // Rethrow to let component handle the error
    }
  }

  // Standard handling for all other endpoints
  try {
    console.log(`Making authenticated request to: ${url}`);

    // Create a controller to handle request abortion
    const controller = new AbortController();
    const { signal } = controller;

    const response = await fetch(url, {
      ...options,
      signal,
      credentials: 'include', // Always include credentials for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    }).catch(error => {
      // Suppress abort errors in the console
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.log('Fetch error:', error);
      }
      return null;
    });

    // If fetch was aborted or failed
    if (!response) {
      console.log('Request failed or was aborted');

      // Return appropriate empty data based on endpoint
      if (url.includes('list')) {
        return { list: [], total: 0 };
      }
      if (url.includes('/api/user') && localStorage.getItem('userData')) {
        return JSON.parse(localStorage.getItem('userData') || '{}');
      }
      return {};
    }

    console.log(`Response status for ${url}: ${response.status}`);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Authentication failed, redirecting to login');
        localStorage.removeItem('userData');
        window.location.href = '/signin';
        throw new Error('Session expired');
      }

      // Handle other error statuses
      try {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || `Error: ${response.status}`;
        } catch {
          // If not JSON, use text
          errorMessage = errorText || `Error: ${response.status}`;
        }

        console.log(`API error (${response.status}):`, errorMessage);
      } catch (e) {
        console.log(`Error reading response: ${e}`);
      }

      // For non-401 errors, don't throw - return empty data instead
      if (url.includes('list')) {
        return { list: [], total: 0 };
      }
      return {};
    }

    // Check if response is JSON
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (e) {
      console.log(`Error parsing response: ${e}`);
      // Return appropriate empty data based on endpoint
      if (url.includes('list')) {
        return { list: [], total: 0 };
      }
      return {};
    }
  } catch (error) {
    // Only log errors that aren't abort errors
    if (error && typeof error === 'object' && 'name' in error && error.name !== 'AbortError') {
      console.log('API request error:', error);
    }

    // Don't propagate errors to components, return empty data instead
    if (error instanceof Error && error.message === 'Session expired') {
      throw error; // Only rethrow session expired errors
    }

    // Return appropriate empty data structure based on endpoint
    if (typeof url === 'string') {
      if (url.includes('list')) {
        return { list: [], total: 0 };
      }
      if (url.includes('/api/user') && localStorage.getItem('userData')) {
        return JSON.parse(localStorage.getItem('userData') || '{}');
      }
    }
    return {};
  }
};

// Request a new verification email
// Note: This function is not currently used in the application 
// but is kept for potential future use
export const resendVerificationEmail = async (email: string) => {
  try {
    // In a future implementation, this would call the verification endpoint
    // For now, we just simulate a successful response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
};