// Test script for experimenting with zoneId formats
// This can be run from the browser console when logged in

async function testZoneIdFormats() {
  // Get the current user data first to have a baseline
  try {
    const response = await fetch("https://api.akesomind.com/api/user", {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      console.error(`GET failed with status ${response.status}`);
      return;
    }
    
    const userData = await response.json();
    console.log("Current user data:", userData);
    console.log("Current zoneId format:", userData.zoneId);
    
    // Test different formats for zoneId
    const testFormats = [
      { test: "String format", zoneId: "UTC" },
      { test: "Object with id", zoneId: { id: "UTC" } },
      { test: "Object with ZoneId format", zoneId: { zoneId: "UTC" } },
      { test: "Object with name", zoneId: { name: "UTC" } }
    ];
    
    for (const format of testFormats) {
      console.log(`Testing format: ${format.test}`);
      
      // Create a minimal body with just what's needed
      const body = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        zoneId: format.zoneId
      };
      
      console.log("Request body:", JSON.stringify(body, null, 2));
      
      try {
        const updateResponse = await fetch("https://api.akesomind.com/api/user", {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(body)
        });
        
        console.log(`Response status for ${format.test}: ${updateResponse.status}`);
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error(`Error for ${format.test}:`, errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Parsed error:", errorJson);
          } catch (e) {
            // Not JSON
          }
        } else {
          const result = await updateResponse.json();
          console.log(`Success for ${format.test}:`, result);
          console.log("Working zoneId format found!");
          break; // Exit after finding a working format
        }
      } catch (e) {
        console.error(`Exception for ${format.test}:`, e);
      }
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

// Run this function from the browser console when logged in
// testZoneIdFormats();

// Export for potential use in other files
export { testZoneIdFormats }; 