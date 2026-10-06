export interface ReleaseConfig {
  githubOwner: string;
  githubRepo: string;
  version: string;
  tag: string;
  channel: string;
  fileName: string;
  sha256: string;
  sizeBytes: number;
  displaySize: string;
  unpackedSize: string;
  repoUrl: string;
  releaseUrl: string;
  downloadUrl: string;
  verificationCommand: string;
  isPlaceholderOwner: boolean;
}

export interface ChangelogEntry {
  version: string;
  channel: string;
  title: string;
  bullets: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
  code?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tag?: string;
}

export interface StepItem {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface RequirementItem {
  title: string;
  value: string;
  icon: string;
  note: string;
}

const GITHUB_OWNER: string = 'Erpirota';
const GITHUB_REPO = 'MMIS';
const APP_VERSION = '0.1.0';
const TAG = `v${APP_VERSION}`;
const FILE_NAME = `MMIS-${APP_VERSION}-Windows-x64.zip`;
const REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
const SITE_URL: string = 'https://mmis-website.marhpp2009.workers.dev';

export const releaseConfig: ReleaseConfig = {
  githubOwner: GITHUB_OWNER,
  githubRepo: GITHUB_REPO,
  version: APP_VERSION,
  tag: TAG,
  channel: 'Release Candidate',
  fileName: FILE_NAME,
  sha256: 'E71FC15AF5A3F9721A35F088C1C22C88E5B11873611CB97E07ED1089E0629732',
  sizeBytes: 44782398,
  displaySize: '42.7 MB',
  unpackedSize: '~105 MB',
  repoUrl: REPO_URL,
  releaseUrl: `${REPO_URL}/releases/tag/${TAG}`,
  downloadUrl: `${REPO_URL}/releases/download/${TAG}/${FILE_NAME}`,
  verificationCommand: `Get-FileHash .\\${FILE_NAME} -Algorithm SHA256`,
  isPlaceholderOwner: GITHUB_OWNER === 'OWNER',
};

export const siteConfig = {
  appName: GITHUB_REPO,
  fullName: 'Minecraft Mod Intelligence Studio',
  metaTitle: `${GITHUB_REPO} - Minecraft Mod Intelligence Studio`,
  metaDescription: 'Offline diagnostic workbench for Minecraft modpacks. Analyze dependencies, isolate conflicts, inspect crash logs, and verify modpack integrity 100% offline.',
  siteUrl: SITE_URL,
  isPlaceholderSiteUrl: SITE_URL === 'https://placeholder.domain.example',
  ...releaseConfig,
};

export const featuresList: FeatureItem[] = [
  {
    id: 'modpack-analysis',
    title: 'Modpack analysis',
    description: 'Comprehensive inspection of modpack folders across Fabric, Quilt, Forge, and NeoForge.',
    icon: 'scan',
    tag: 'MULTI-LOADER',
  },
  {
    id: 'dependency-analysis',
    title: 'Dependency analysis',
    description: 'Resolves required and optional dependencies and alerts on circular dependency cycles.',
    icon: 'dependencies',
    tag: 'DEPENDENCIES',
  },
  {
    id: 'conflict-detection',
    title: 'Conflict detection',
    description: 'Identifies duplicate mod IDs, declared breaks, and loader or Minecraft version mismatches.',
    icon: 'alert_triangle',
    tag: 'CONFLICTS',
  },
  {
    id: 'crash-log-analysis',
    title: 'Crash log analysis',
    description: 'Analyzes crash reports, latest.log, and JVM hs_err files to identify ranked suspect mods.',
    icon: 'crash',
    tag: 'DIAGNOSTICS',
  },
  {
    id: 'issue-evidence',
    title: 'Issue evidence',
    description: 'Every finding shows exact file, field, and raw value with Certain, Possible, or Insufficient data ratings.',
    icon: 'info',
    tag: 'EVIDENCE',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Self-contained HTML and JSON diagnostic reports for sharing and archival.',
    icon: 'report',
    tag: 'EXPORTABLE',
  },
  {
    id: 'backup',
    title: 'Backup',
    description: 'Zip archives with SHA-256 manifests and automatic safety backups created before restore.',
    icon: 'backup',
    tag: 'ARCHIVE',
  },
  {
    id: 'compare',
    title: 'Compare',
    description: 'Diff two scan snapshots: added/removed/changed mods, resolved/new issues.',
    icon: 'compare',
    tag: 'SNAPSHOTS',
  },
  {
    id: 'offline-workflow',
    title: 'Offline-first workflow',
    description: 'No account, zero network requests, and all diagnostic data stays local in %APPDATA%\\MMIS.',
    icon: 'package',
    tag: 'OFFLINE',
  },
];

export const howItWorksSteps: StepItem[] = [
  {
    step: 1,
    title: 'Download',
    description: 'Get the zip from the GitHub release and check its SHA-256.',
    icon: 'download',
  },
  {
    step: 2,
    title: 'Open MMIS',
    description: 'Unpack the archive and launch MMIS.exe directly with no setup installer or admin rights.',
    icon: 'launch',
  },
  {
    step: 3,
    title: 'Add a modpack',
    description: 'Point a profile to your local CurseForge, Modrinth, MultiMC, or custom modpack folder.',
    icon: 'add',
  },
  {
    step: 4,
    title: 'Scan',
    description: 'Run a read-only scan of every mod jar and pack manifest in the folder.',
    icon: 'scan',
  },
  {
    step: 5,
    title: 'Investigate issues',
    description: 'Review prioritized conflict alerts, dependency chains, and crash causes with full evidence.',
    icon: 'search',
  },
];

export const requirementsList: RequirementItem[] = [
  {
    title: 'Operating System',
    value: 'Windows 10 or 11, 64-bit (x64)',
    icon: 'dashboard',
    note: 'Developed and tested on Windows 11.',
  },
  {
    title: 'Disk Storage',
    value: `${releaseConfig.unpackedSize} free space`,
    icon: 'folder',
    note: `Compact standalone archive (${releaseConfig.displaySize} download).`,
  },
  {
    title: 'Runtimes & SDKs',
    value: 'None required',
    icon: 'check',
    note: 'No Python, Java runtime, or development tools required.',
  },
  {
    title: 'Network Access',
    value: 'No connection required',
    icon: 'package',
    note: 'Works fully offline. MMIS makes no network requests.',
  },
  {
    title: 'System Privileges',
    value: 'Standard user rights',
    icon: 'info',
    note: 'No administrative elevation or installer wizards needed.',
  },
  {
    title: 'Installation',
    value: 'None',
    icon: 'launch',
    note: 'Unzip and run MMIS.exe.',
  },
];

export const changelogData: ChangelogEntry[] = [
  {
    version: APP_VERSION,
    channel: 'Release Candidate',
    title: 'First public release',
    bullets: [
      'Offline-first modpack analysis engine supporting Fabric, Quilt, Forge, and NeoForge loaders.',
      'Manifest ingestion for CurseForge, Modrinth, and MultiMC profile folder layouts.',
      'Deep dependency graph resolution with required/optional dependency mapping and cycle detection.',
      'Conflict diagnosis for duplicate mod IDs, declared breakages, and loader/Minecraft version mismatches.',
      'Crash log analyzer parsing crash reports, latest.log, and JVM hs_err dumps with root cause isolation.',
      'Verifiable issue evidence linking findings directly to specific files, fields, and raw values.',
      'Self-contained HTML and JSON report export for sharing and troubleshooting.',
      'Scan snapshot comparison engine and automated zip backup system with SHA-256 integrity checks.',
      'Includes both desktop graphical interface and mmis-cli.exe headless command-line utility.',
    ],
  },
];

export const faqList: FaqItem[] = [
  {
    question: `What is ${GITHUB_REPO}?`,
    answer: `${GITHUB_REPO} (Minecraft Mod Intelligence Studio) reads mod metadata, checks dependencies, detects conflicts and analyzes crash logs. Files are opened read-only.`,
  },
  {
    question: 'Which systems does it run on?',
    answer: 'MMIS runs on 64-bit Windows 10 and Windows 11. It is distributed as a self-contained portable application with no installer required.',
  },
  {
    question: 'Do I need Python or Java installed?',
    answer: 'No. MMIS is compiled as a standalone Windows executable. It bundles its required execution runtime, meaning you do not need Python, Java, or external developer runtimes installed to run the application.',
  },
  {
    question: 'Do I need an internet connection?',
    answer: 'No. MMIS is 100% offline. It makes zero external network requests. All metadata parsing, dependency evaluation, and report generation take place entirely on your local machine, and application data remains stored in %APPDATA%\\MMIS.',
  },
  {
    question: 'Does MMIS modify my modpacks?',
    answer: 'No. MMIS operates strictly in read-only mode. It never alters, updates, deletes, or downloads mods or configuration files in your modpack directory.',
  },
  {
    question: 'How do I verify the downloaded file?',
    answer: 'You can verify file integrity in PowerShell by comparing the calculated SHA-256 against our published fingerprint:',
    code: `Get-FileHash .\\${FILE_NAME} -Algorithm SHA256`,
  },
  {
    question: 'Why might Windows SmartScreen show a warning?',
    answer: 'Windows SmartScreen can show a warning for new applications that are not yet widely downloaded. Before running MMIS, compare the SHA-256 of your download with the value in the Download section to confirm the file arrived intact.',
  },
];
