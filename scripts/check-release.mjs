import { releaseConfig, siteConfig } from '../src/config/site.ts';

if (releaseConfig.isPlaceholderOwner) {
  console.error('Pre-deploy release check failed: githubOwner is currently set to placeholder.');
  console.error('Please configure your real GitHub organization or username in src/config/site.ts before deploying.');
  process.exit(1);
}

if (siteConfig.isPlaceholderSiteUrl || siteConfig.siteUrl.includes('placeholder') || siteConfig.siteUrl.includes('example')) {
  console.error('Pre-deploy release check failed: siteUrl is currently set to placeholder.');
  console.error('Please configure your real production siteUrl in src/config/site.ts before deploying.');
  process.exit(1);
}

console.log(`Pre-deploy release check passed: ${releaseConfig.githubOwner}/${releaseConfig.githubRepo} (${releaseConfig.tag})`);
process.exit(0);
