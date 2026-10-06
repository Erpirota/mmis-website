import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { releaseConfig, siteConfig } from '../src/config/site.ts';

const DIST_DIR = path.resolve('dist');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test('HTML contains zero inline script bodies, zero style tags, and zero style attributes', () => {
  const htmlFiles = getAllFiles(DIST_DIR).filter((f) => f.endsWith('.html'));
  assert.ok(htmlFiles.length > 0, 'dist must contain HTML files');

  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf8');

    // 1. Zero style elements
    const styleTagMatches = content.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
    assert.equal(
      styleTagMatches,
      null,
      `Found inline <style> tag in ${path.relative(DIST_DIR, htmlFile)}`
    );

    // 2. Zero style="" attributes
    const styleAttrMatches = content.match(/\sstyle\s*=\s*['"][^'"]*['"]/gi);
    assert.equal(
      styleAttrMatches,
      null,
      `Found inline style attribute in ${path.relative(DIST_DIR, htmlFile)}`
    );

    // 3. Zero inline script bodies
    const scriptTags = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const scriptTag of scriptTags) {
      const srcMatch = scriptTag.match(/src\s*=\s*['"][^'"]+['"]/i);
      assert.ok(
        srcMatch,
        `Found <script> tag without src attribute in ${path.relative(DIST_DIR, htmlFile)}: ${scriptTag}`
      );

      const innerContent = scriptTag
        .replace(/<script\b[^>]*>/i, '')
        .replace(/<\/script>/i, '')
        .trim();
      assert.equal(
        innerContent,
        '',
        `Found non-empty inline script content in ${path.relative(DIST_DIR, htmlFile)}`
      );
    }
  }
});

test('Asset URLs in HTML are same-origin relative, external links point to GitHub or siteUrl', () => {
  const htmlFiles = getAllFiles(DIST_DIR).filter((f) => f.endsWith('.html'));

  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf8');

    // Check script src and link href
    const scriptSrcMatches = content.match(/<script\b[^>]*\bsrc=['"]([^'"]+)['"]/gi) || [];
    for (const tag of scriptSrcMatches) {
      const src = tag.match(/src=['"]([^'"]+)['"]/i)[1];
      assert.ok(
        src.startsWith('/') || src.startsWith('./') || src.startsWith('../'),
        `Script src must be relative: ${src}`
      );
    }

    const cssLinkMatches = content.match(/<link\b[^>]*rel=['"]stylesheet['"][^>]*href=['"]([^'"]+)['"]/gi) || [];
    for (const tag of cssLinkMatches) {
      const href = tag.match(/href=['"]([^'"]+)['"]/i)[1];
      assert.ok(
        href.startsWith('/') || href.startsWith('./') || href.startsWith('../'),
        `Stylesheet href must be relative: ${href}`
      );
    }

    // Check all absolute URLs in HTML
    const absoluteUrls = content.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    for (const url of absoluteUrls) {
      const isGithub = url.startsWith('https://github.com/');
      const isSitePlaceholder = url.startsWith(siteConfig.siteUrl);
      const isXmlNamespace = url.startsWith('http://www.w3.org/2000/svg');
      assert.ok(
        isGithub || isSitePlaceholder || isXmlNamespace,
        `Unexpected absolute URL found in HTML: ${url}`
      );
    }
  }
});

test('dist/_headers exists and enforces all required security directives and Permissions-Policy', () => {
  const headersFile = path.join(DIST_DIR, '_headers');
  assert.ok(fs.existsSync(headersFile), 'dist/_headers must exist');

  const content = fs.readFileSync(headersFile, 'utf8');
  assert.ok(content.includes('Content-Security-Policy:'), 'Must include Content-Security-Policy');

  const requiredCspDirectives = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'none'",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ];

  for (const directive of requiredCspDirectives) {
    assert.ok(
      content.includes(directive),
      `CSP in _headers missing directive: ${directive}`
    );
  }

  assert.ok(!content.includes("'unsafe-inline'"), 'CSP must not contain unsafe-inline');
  assert.ok(!content.includes("'unsafe-eval'"), 'CSP must not contain unsafe-eval');

  assert.ok(content.includes('Strict-Transport-Security: max-age=31536000; includeSubDomains'));
  assert.ok(content.includes('X-Content-Type-Options: nosniff'));
  assert.ok(content.includes('X-Frame-Options: DENY'));
  assert.ok(content.includes('Referrer-Policy: strict-origin-when-cross-origin'));
  assert.ok(content.includes('Permissions-Policy:'), 'Must include Permissions-Policy');
  assert.ok(content.includes('Cross-Origin-Opener-Policy: same-origin'));
  assert.ok(content.includes('Cross-Origin-Resource-Policy: same-origin'));
});

test('No .map, .zip, or .exe files exist in dist', () => {
  const distFiles = getAllFiles(DIST_DIR);
  for (const file of distFiles) {
    const ext = path.extname(file).toLowerCase();
    assert.notEqual(ext, '.map', `Found sourcemap file in dist: ${file}`);
    assert.notEqual(ext, '.zip', `Found archive binary in dist: ${file}`);
    assert.notEqual(ext, '.exe', `Found executable binary in dist: ${file}`);
  }
});

test('Exact SHA-256 and Download URL appear in index.html', () => {
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  assert.ok(
    indexHtml.includes(releaseConfig.sha256),
    `Exact SHA-256 ${releaseConfig.sha256} must appear in index.html`
  );

  assert.ok(
    indexHtml.includes(releaseConfig.downloadUrl),
    `Config-derived downloadUrl must appear in index.html: ${releaseConfig.downloadUrl}`
  );

  assert.ok(
    releaseConfig.downloadUrl.endsWith(`/${releaseConfig.fileName}`),
    `downloadUrl must end with /${releaseConfig.fileName}`
  );
});

test('Forbidden pattern scan across dist and tracked source', () => {
  const networkTokens = ['localhost', '127.0.0.1', '192.168.'];
  const generalTokens = [
    'file://',
    'C:\\Users',
    '/Users/',
    '/home/',
    '@gmail',
    'eval(',
    'new Function',
    'innerHTML',
    'document.write',
  ];

  const shippedDirs = ['src', 'public'];
  const testDirs = ['scripts', 'tests'];
  const textExtensions = ['.html', '.css', '.js', '.mjs', '.ts', '.astro', '.svg', '.json', '.txt', '.md'];

  const shippedFiles = [];
  getAllFiles(DIST_DIR).forEach((f) => {
    if (textExtensions.includes(path.extname(f).toLowerCase()) || path.basename(f) === '_headers') {
      shippedFiles.push(f);
    }
  });
  shippedDirs.forEach((dir) => {
    getAllFiles(path.resolve(dir)).forEach((f) => {
      if (textExtensions.includes(path.extname(f).toLowerCase()) || path.basename(f) === '_headers') {
        shippedFiles.push(f);
      }
    });
  });

  const devFiles = [];
  testDirs.forEach((dir) => {
    getAllFiles(path.resolve(dir)).forEach((f) => {
      if (textExtensions.includes(path.extname(f).toLowerCase())) {
        devFiles.push(f);
      }
    });
  });
  ['astro.config.mjs', 'package.json', 'tsconfig.json', 'README.md', 'playwright.config.ts'].forEach((f) => {
    const full = path.resolve(f);
    if (fs.existsSync(full)) devFiles.push(full);
  });

  // 1. Shipped files must never contain networkTokens or generalTokens
  for (const filePath of shippedFiles) {
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    for (const token of [...networkTokens, ...generalTokens]) {
      assert.ok(
        !content.includes(token.toLowerCase()),
        `Forbidden pattern "${token}" found in shipped file ${path.relative(process.cwd(), filePath)}`
      );
    }
  }

  // 2. Dev files must never contain generalTokens (and networkTokens only in test harness per T1)
  for (const filePath of devFiles) {
    if (filePath.endsWith('audit-dist.mjs')) continue;
    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
    for (const token of generalTokens) {
      assert.ok(
        !content.includes(token.toLowerCase()),
        `Forbidden pattern "${token}" found in dev file ${path.relative(process.cwd(), filePath)}`
      );
    }
  }
});

test('Performance sanity budgets for JS, CSS, and images', () => {
  const distFiles = getAllFiles(DIST_DIR);

  let totalJsBytes = 0;
  let totalCssBytes = 0;

  for (const file of distFiles) {
    const stat = fs.statSync(file);
    const ext = path.extname(file).toLowerCase();

    if (ext === '.js' || ext === '.mjs') {
      totalJsBytes += stat.size;
    } else if (ext === '.css') {
      totalCssBytes += stat.size;
    }

    if (['.png', '.webp', '.avif', '.jpg', '.jpeg', '.svg'].includes(ext)) {
      assert.ok(
        stat.size <= 400 * 1024,
        `Image ${path.relative(DIST_DIR, file)} exceeds 400 KB limit (${stat.size} bytes)`
      );
    }
  }

  assert.ok(
    totalJsBytes <= 30 * 1024,
    `Total uncompressed JS (${totalJsBytes} bytes) exceeds 30 KB budget`
  );
  assert.ok(
    totalCssBytes <= 60 * 1024,
    `Total uncompressed CSS (${totalCssBytes} bytes) exceeds 60 KB budget`
  );
});
