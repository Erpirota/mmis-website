# MMIS Website

The official static marketing and distribution website for MMIS (Minecraft Mod Intelligence Studio).

## Tech Stack

- **Framework**: Astro (Static Output, `output: 'static'`)
- **UI Frameworks**: None (Pure HTML & Astro Components)
- **Scripting**: Vanilla TypeScript (strict CSP compliance, zero inline scripts)
- **Styling**: Standard CSS with custom design tokens (no external utility frameworks)
- **Typography**: Self-hosted fonts via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`
- **Asset Processing**: `astro:assets` and Sharp for responsive AVIF/WebP image generation
- **Testing**: Node.js test runner (`node:test`) for artifact audits and Playwright for Chromium end-to-end tests

## Development & Build Commands

- `npm install`: Install dependencies and prebuilt binaries.
- `npm run dev`: Start local Astro development server.
- `npm run build`: Compile static production build to `dist/`.
- `npm run preview`: Preview production build locally.
- `npm run check`: Run Astro type check and diagnostics.
- `npm run check:release`: Pre-deploy verification gate to ensure release configuration is not using placeholder values.
- `npm test`: Run full verification suite (`build` + `test:audit` + `test:e2e`).
- `npm run test:audit`: Run security and production build checks against `dist/`.
- `npm run test:e2e`: Run Playwright end-to-end and responsive viewport tests.

## Release Configuration

All release parameters are centralized in a single source of truth located at `src/config/site.ts`.

To configure a new public release:

1. Open `src/config/site.ts`.
2. Update the release parameters:
   - `githubOwner`: Your GitHub organization or account name.
   - `githubRepo`: Repository name (e.g., `MMIS`).
   - `version`: Semantic version string (e.g., `0.1.0`).
   - `channel`: Release channel designation (e.g., `Release Candidate` or `Stable`).
   - `sha256`: Uppercase 64-character SHA-256 hash of the release zip archive.
   - `sizeBytes` / `displaySize`: Exact byte size and display file size.
   - `unpackedSize`: Estimated unpacked size on disk.
   - `siteUrl`: Canonical domain URL of the production deployment (must replace the example placeholder).
3. Run `npm run check:release` before deploying. This script verifies that both the repository owner and siteUrl are properly set and exits non-zero if either placeholder remains.

## Adding a Changelog Entry

To record a new release notes entry:

1. Open `src/config/site.ts`.
2. Add a new object to the `changelogData` array:
   ```ts
   {
     version: '0.2.0',
     channel: 'Stable',
     title: 'Summary of the release',
     bullets: [
       'Description of feature or improvement.',
       'Description of bug fix or performance optimization.'
     ]
   }
   ```
3. Rebuild the site (`npm run build`). The Changelog section updates automatically from this data.

## Cloudflare Pages Deployment

Deploy using the Cloudflare Pages dashboard or CLI with the following settings:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables**:
  - `NODE_VERSION`: `22` (or `24`)

Security headers, strict Content Security Policy directives, and cache control rules are configured via `public/_headers` and deployed directly to Cloudflare Pages.
