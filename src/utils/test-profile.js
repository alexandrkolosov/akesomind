/**
 * Test Profile Implementation
 * 
 * This script can be run in the browser console to test the profile implementation
 * by setting up test users and checking how the profile views render.
 */

// Function to set up a test client
function setupTestClient() {
  const clientData = {
    id: 'client-123',
    email: 'client@example.com',
    firstName: 'Test',
    lastName: 'Client',
    role: 'Client',
    timezone: 'America/New_York',
    birthday: '1990-01-01',
    phone: '+1234567890',
    lastSession: '2023-05-15'
  };
  
  localStorage.setItem('userData', JSON.stringify(clientData));
  localStorage.setItem('token', 'fake-jwt-token-for-testing');
  console.log('✅ Test client set up:', clientData);
  
  // Reload the page to apply changes
  window.location.reload();
}

// Function to set up a test therapist
function setupTestTherapist() {
  const therapistData = {
    id: 'therapist-456',
    email: 'therapist@example.com',
    firstName: 'Test',
    lastName: 'Therapist',
    role: 'Therapist',
    timezone: 'America/Los_Angeles',
    specialization: 'Cognitive Behavioral Therapy',
    yearsOfExperience: 5,
    certifications: ['Licensed Clinical Social Worker', 'Certified Trauma Professional'],
    activeClients: 12,
    sessionsThisMonth: 45,
    totalSessions: 256
  };
  
  localStorage.setItem('userData', JSON.stringify(therapistData));
  localStorage.setItem('token', 'fake-jwt-token-for-testing');
  console.log('✅ Test therapist set up:', therapistData);
  
  // Reload the page to apply changes
  window.location.reload();
}

// Function to clear test user
function clearTestUser() {
  localStorage.removeItem('userData');
  localStorage.removeItem('token');
  console.log('🗑️ Test user cleared');
  
  // Reload the page to apply changes
  window.location.reload();
}

// Function to check the current user
function checkCurrentUser() {
  const userData = localStorage.getItem('userData');
  if (!userData) {
    console.log('❌ No user found in localStorage');
    return null;
  }
  
  try {
    const parsedUser = JSON.parse(userData);
    console.log('Current user:', parsedUser);
    return parsedUser;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

// Help function to display available commands
function help() {
  console.log(`
Available test commands:
-----------------------
setupTestClient()     - Set up a test client user
setupTestTherapist()  - Set up a test therapist user
clearTestUser()       - Clear the current test user
checkCurrentUser()    - Check the current user data
help()                - Display this help message
  `);
}

// Display help message when the script is loaded
console.log('🧪 Profile Test Utilities loaded. Type help() for available commands.');

// Export the functions to make them available in the global scope
window.setupTestClient = setupTestClient;
window.setupTestTherapist = setupTestTherapist;
window.clearTestUser = clearTestUser;
window.checkCurrentUser = checkCurrentUser;
window.help = help; 