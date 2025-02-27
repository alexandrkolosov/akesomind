/**
 * Utility script to find and fix problematic import paths
 * Run this script from the terminal to identify files with incorrect import paths
 * 
 * Usage: node src/utils/fixImports.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Pattern to find problematic imports
const problematicPatterns = [
  /from\s+['"]\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth['"]/g,
  /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/akesomind\/src\/utils\/auth['"]/g,
  /from\s+['"]\.\.\/\.\.\/akesomind\/src\/utils\/auth['"]/g
];

// Function to find all files recursively in a directory
async function findFiles(dir, fileList = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory() && file !== 'node_modules' && file !== 'build' && file !== '.git') {
      fileList = await findFiles(filePath, fileList);
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Function to check and fix problematic imports in a file
async function checkAndFixFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let newContent = content;
    let hasProblematicImport = false;

    for (const pattern of problematicPatterns) {
      if (pattern.test(content)) {
        hasProblematicImport = true;
        // Replace problematic imports with correct local path
        newContent = newContent.replace(pattern, 'from "../../utils/auth"');
      }
    }

    if (hasProblematicImport) {
      console.log(`Found problematic import in: ${filePath}`);
      await writeFile(filePath, newContent, 'utf8');
      console.log(`Fixed import in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    const srcDir = path.resolve(__dirname, '../../src');
    console.log('Searching for files in:', srcDir);

    const files = await findFiles(srcDir);
    console.log(`Found ${files.length} files to check`);

    for (const file of files) {
      await checkAndFixFile(file);
    }

    console.log('Done checking and fixing files');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main(); 