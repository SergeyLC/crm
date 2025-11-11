#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to root package.json
const packageJsonPath = path.join(__dirname, '..', 'db', 'package.json');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;
console.log(`📦 Current version: ${currentVersion}`);

// Increment patch version (0.1.11 -> 0.1.12)
const versionParts = currentVersion.split('.');
const major = versionParts[0];
const minor = versionParts[1];
const patch = parseInt(versionParts[2], 10) + 1;
const newVersion = `${major}.${minor}.${patch}`;

console.log(`✨ New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
console.log(`✅ Updated db/package.json`);

// Git commands
const commitMessage = `Provide Release Tag ${newVersion}`;
const tagName = `v${newVersion}`;

try {
  // Stage all changes
  console.log('\n📝 Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });

  // Commit
  console.log(`📝 Committing: "${commitMessage}"...`);
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push
  console.log('🚀 Pushing to remote...');
  execSync('git push', { stdio: 'inherit' });

  // Create annotated tag
  console.log(`🏷️  Creating tag: ${tagName}...`);
  execSync(`git tag -a ${tagName} -m "${commitMessage}"`, { stdio: 'inherit' });

  // Push tag
  console.log(`🚀 Pushing tag: ${tagName}...`);
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

  console.log(`\n✅ Deployment successful!`);
  console.log(`📦 Version: ${newVersion}`);
  console.log(`🏷️  Tag: ${tagName}`);
  console.log(`\n🚀 GitHub Actions will now deploy to production server...`);

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}
