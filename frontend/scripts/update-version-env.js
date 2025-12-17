const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const packageJson = require('../package.json');
const version = `${packageJson.version}+dev`;

// Read existing .env.local if it exists
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf-8');
} catch (err) {
  // File doesn't exist, create default content
  envContent = `NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:4002/api
NEXT_TELEMETRY_DISABLED=1
`;
}

// Update or add NEXT_PUBLIC_APP_VERSION
const lines = envContent.split('\n');
let versionUpdated = false;

const updatedLines = lines.map(line => {
  if (line.startsWith('NEXT_PUBLIC_APP_VERSION=')) {
    versionUpdated = true;
    return `NEXT_PUBLIC_APP_VERSION=${version}`;
  }
  return line;
});

if (!versionUpdated) {
  updatedLines.push(`NEXT_PUBLIC_APP_VERSION=${version}`);
}

// Write back
fs.writeFileSync(envPath, updatedLines.join('\n'));
console.log(`Updated NEXT_PUBLIC_APP_VERSION to ${version}`);
