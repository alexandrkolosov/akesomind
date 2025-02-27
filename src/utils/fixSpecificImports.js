/**
 * Utility script to fix specific files with problematic imports
 * Run this script from the terminal to fix the specific files mentioned in the error
 * 
 * Usage: node src/utils/fixSpecificImports.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const exists = util.promisify(fs.exists);

// Files with problematic imports
const problematicFiles = [
  'src/components/UserProfile/UserInfoCard.tsx',
  'src/components/tables/DataTables/TableOne/DataTableOne.tsx',
  'src/pages/AuthPages/SignIn.tsx'
];

// Function to fix a specific file
async function fixFile(filePath) {
  if (!(await exists(filePath))) {
    console.log(`File does not exist: ${filePath}`);
    return;
  }

  try {
    console.log(`Checking file: ${filePath}`);
    let content = await readFile(filePath, 'utf8');

    // Check for problematic imports
    if (content.includes('../../../akesomind/src/utils/auth') ||
      content.includes('../../../../akesomind/src/utils/auth') ||
      content.includes('../../../../../akesomind/src/utils/auth')) {

      // Replace with correct relative path
      content = content.replace(/'\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth'/g, '"../../utils/auth"');
      content = content.replace(/'\.\.\/\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth'/g, '"../../../utils/auth"');
      content = content.replace(/'\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth'/g, '"../../../../utils/auth"');

      // Also replace with double quotes
      content = content.replace(/"\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth"/g, '"../../utils/auth"');
      content = content.replace(/"\.\.\/\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth"/g, '"../../../utils/auth"');
      content = content.replace(/"\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth"/g, '"../../../../utils/auth"');

      await writeFile(filePath, content, 'utf8');
      console.log(`Fixed import in: ${filePath}`);
    } else {
      console.log(`No problematic import found in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    for (const file of problematicFiles) {
      await fixFile(file);
    }

    console.log('Done fixing specific files');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main(); 