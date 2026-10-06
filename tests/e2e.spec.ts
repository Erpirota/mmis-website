import { test, expect } from '@playwright/test';
import { releaseConfig } from '../src/config/site.ts';
import fs from 'node:fs';
import path from 'node:path';

const SECTION_IDS = [
  'hero',
  'features',
  'screenshots',
  'how-it-works',
  'download',
  'requirements',
  'changelog',
  'faq',
  'footer',
];

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '960x600', width: 960, height: 600 },
  { name: '360x740', width: 360, height: 740 },
];

test.describe('MMIS Website - Functional & Security E2E', () => {
  test('No console errors, no CSP violations, all requests within origin', async ({ page, baseURL }) => {
    const consoleErrors: string[] = [];
    const cspViolations: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.addInitScript(() => {
      window.addEventListener('securitypolicyviolation', (e) => {
        // @ts-ignore
        window.__cspViolations = window.__cspViolations || [];
        // @ts-ignore
        window.__cspViolations.push(`${e.blockedURI} violated ${e.violatedDirective}`);
      });
    });

    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        const originUrl = new URL(baseURL!);
        if (url.origin !== originUrl.origin) {
          externalRequests.push(req.url());
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const browserViolations = await page.evaluate(() => {
      // @ts-ignore
      return window.__cspViolations || [];
    });

    expect(consoleErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
    expect(browserViolations).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('All 9 sections present with IDs and valid CTA links', async ({ page }) => {
    await page.goto('/');

    for (const sectionId of SECTION_IDS) {
      const section = page.locator(`#${sectionId}`);
      await expect(section).toBeAttached();
    }

    // Hero download CTA href
    const heroBtn = page.locator('#hero-download-btn');
    await expect(heroBtn).toHaveAttribute('href', releaseConfig.downloadUrl);

    // Download section button href
    const downloadSectionBtn = page.locator('#main-download-btn');
    await expect(downloadSectionBtn).toHaveAttribute('href', releaseConfig.downloadUrl);

    // Learn more button scrolls to features
    const learnMoreBtn = page.locator('#hero-learn-more-btn');
    await expect(learnMoreBtn).toHaveAttribute('href', '#features');
  });

  test('Navbar scrolled state toggles on scroll', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('#header');
    await expect(header).not.toHaveClass(/scrolled/);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);
    await expect(header).toHaveClass(/scrolled/);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    await expect(header).not.toHaveClass(/scrolled/);
  });

  test('Mobile navigation menu toggles by click and Escape key', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');

    const toggleBtn = page.locator('#mobile-menu-toggle');
    const mobileNav = page.locator('#mobile-nav');

    await expect(mobileNav).toBeHidden();
    await toggleBtn.click();
    await expect(mobileNav).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(mobileNav).toBeHidden();
    await expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(toggleBtn).toBeFocused();
  });

  test('Lightbox opens from thumbnail, navigates with arrow keys, closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const firstThumb = page.locator('[data-gallery-trigger]').first();
    const lightboxDialog = page.locator('#lightbox-dialog');
    const lightboxCounter = page.locator('#lightbox-counter');
    const lightboxImg = page.locator('#lightbox-img');

    await firstThumb.click();
    await expect(lightboxDialog).toHaveAttribute('open', '');
    await expect(lightboxCounter).toHaveText('1 / 9');
    await expect(lightboxImg).toBeVisible();

    // ArrowRight to next
    await page.keyboard.press('ArrowRight');
    await expect(lightboxCounter).toHaveText('2 / 9');

    // ArrowLeft back to previous
    await page.keyboard.press('ArrowLeft');
    await expect(lightboxCounter).toHaveText('1 / 9');

    // Escape to close
    await page.keyboard.press('Escape');
    await expect(lightboxDialog).not.toHaveAttribute('open', '');
    await expect(firstThumb).toBeFocused();
  });

  test('FAQ native accordion item toggles', async ({ page }) => {
    await page.goto('/');
    const firstFaq = page.locator('.faq-item').first();
    const summary = firstFaq.locator('summary');

    await expect(firstFaq).not.toHaveAttribute('open', '');
    await summary.click();
    await expect(firstFaq).toHaveAttribute('open', '');
    await summary.click();
    await expect(firstFaq).not.toHaveAttribute('open', '');
  });

  test('Copy hash button writes exact SHA-256 to clipboard and provides feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    const copyBtn = page.locator('#copy-hash-btn');
    const copyStatus = page.locator('#copy-status');
    const idleSpan = copyBtn.locator('.copy-idle-state');
    const successSpan = copyBtn.locator('.copy-success-state');

    await copyBtn.click();

    // Check feedback
    await expect(successSpan).toBeVisible();
    await expect(copyStatus).toHaveText(/copied/i);

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(releaseConfig.sha256);
  });

  test('Progressive enhancement - No-JS visibility', async ({ browser }) => {
    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto('/');

    // Verify headings for all sections are visible without JS
    for (const sectionId of SECTION_IDS) {
      const section = noJsPage.locator(`#${sectionId}`);
      await expect(section).toBeVisible();
    }

    // Verify hash is visible
    const hashEl = noJsPage.locator('#sha256-hash-val');
    await expect(hashEl).toBeVisible();
    await expect(hashEl).toHaveText(releaseConfig.sha256);

    await noJsContext.close();
  });

  test('Reduced motion emulation displays fully settled layout', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const heroHeadline = page.locator('.hero-headline');
    await expect(heroHeadline).toBeVisible();

    const allReveals = page.locator('.reveal');
    const count = await allReveals.count();
    for (let i = 0; i < count; i++) {
      const el = allReveals.nth(i);
      const opacity = await el.evaluate((node) => window.getComputedStyle(node).opacity);
      expect(Number(opacity)).toBeGreaterThan(0.9);
    }
  });
});

test.describe('Multi-Viewport Overflow & Visual Regression Suite', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name}: No horizontal overflow & Visual Screenshots`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Settle reveal animations for clean visual capture
      await page.evaluate(() => {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('revealed'));
      });
      await page.waitForTimeout(300);

      // Verify no horizontal overflow at top
      let overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflow, `Overflow detected at top on ${vp.name}`).toBe(true);

      // Scroll to middle and verify
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      await page.waitForTimeout(100);
      overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflow, `Overflow detected at middle on ${vp.name}`).toBe(true);

      // Scroll to bottom and verify
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(100);
      overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflow, `Overflow detected at bottom on ${vp.name}`).toBe(true);

      // Verify with lightbox open
      const firstThumb = page.locator('[data-gallery-trigger]').first();
      await firstThumb.click();
      await page.waitForTimeout(100);
      overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      });
      expect(overflow, `Overflow detected with lightbox open on ${vp.name}`).toBe(true);

      // Close lightbox
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Scroll back to top for screenshots
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      const visualDir = path.resolve('test-results/visual');
      if (!fs.existsSync(visualDir)) {
        fs.mkdirSync(visualDir, { recursive: true });
      }

      // Capture full-page screenshot
      await page.screenshot({
        path: path.join(visualDir, `fullpage-${vp.name}.png`),
        fullPage: true,
      });

      // Capture per-section screenshots
      for (const sectionId of SECTION_IDS) {
        const sectionLoc = page.locator(`#${sectionId}`);
        if (await sectionLoc.isVisible()) {
          await sectionLoc.screenshot({
            path: path.join(visualDir, `section-${sectionId}-${vp.name}.png`),
          });
        }
      }
    });
  }
});

const ALL_WIDTHS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1100x700', width: 1100, height: 700 },
  { name: '960x600', width: 960, height: 600 },
  { name: '360x740', width: 360, height: 740 },
];

const VISUAL_DIR = path.resolve('test-results/visual');

test.describe('Layout integrity', () => {
  test.beforeAll(() => {
    fs.mkdirSync(VISUAL_DIR, { recursive: true });
  });

  test('Mobile menu is an opaque panel that covers the page and is fully clickable', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await page.locator('#mobile-menu-toggle').click();
    const menu = page.locator('#mobile-nav');
    await expect(menu).toBeVisible();
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      const panel = document.getElementById('mobile-nav')!;
      const bg = getComputedStyle(panel).backgroundColor;
      const rect = panel.getBoundingClientRect();
      const links = [...panel.querySelectorAll('a')];
      const blocked = links.filter((a) => {
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(hit && (hit === a || a.contains(hit)));
      }).map((a) => a.textContent?.trim());
      return { bg, top: rect.top, bottom: rect.bottom, width: rect.width, blocked, links: links.length };
    });

    // rgb(...) without an alpha channel means fully opaque
    expect(result.bg).toMatch(/^rgb\(/);
    expect(result.links).toBe(8);
    expect(result.blocked).toEqual([]);
    expect(result.width).toBe(360);
    expect(result.bottom - result.top).toBeGreaterThan(600);
    await expect(page.locator('#mobile-nav a').first()).toBeFocused();
    await expect(page.locator('.menu-icon-close')).toBeVisible();
    await expect(page.locator('.menu-icon-hamburger')).toBeHidden();

    await page.screenshot({ path: path.join(VISUAL_DIR, 'mobile-menu-open-360x740.png') });
  });

  for (const vp of ALL_WIDTHS) {
    test(`Header items never overlap or wrap at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const report = await page.evaluate(() => {
        const visible = (el: Element) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const items = [
          document.querySelector('.logo-link')!,
          ...document.querySelectorAll('.nav-desktop > *'),
          document.querySelector('#mobile-menu-toggle')!,
        ].filter(visible);
        const boxes = items.map((el) => ({ label: el.textContent!.trim() || el.id, r: el.getBoundingClientRect() }));
        const overlaps: string[] = [];
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i].r;
            const b = boxes[j].r;
            if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom && b.top < a.bottom) {
              overlaps.push(`${boxes[i].label} x ${boxes[j].label}`);
            }
          }
        }
        const wrapped = [...document.querySelectorAll('.nav-desktop .nav-link')].filter(visible).filter((el) => {
          const lh = parseFloat(getComputedStyle(el).lineHeight) || 22;
          const cs = getComputedStyle(el);
          const inner = el.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
          return inner > lh * 1.6;
        }).map((el) => el.textContent);
        const clipped = boxes.filter((b) => b.r.left < 0 || b.r.right > document.documentElement.clientWidth).map((b) => b.label);
        return { count: boxes.length, overlaps, wrapped, clipped };
      });

      expect(report.count).toBeGreaterThanOrEqual(2);
      expect(report.overlaps).toEqual([]);
      expect(report.wrapped).toEqual([]);
      expect(report.clipped).toEqual([]);
    });

    test(`No visible text below 12px at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const tooSmall = await page.evaluate(() => {
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const el = node.parentElement;
          if (!el || !node.textContent || !node.textContent.trim()) continue;
          if (el.closest('.sr-only, [hidden], dialog:not([open])')) continue;
          if (el.getClientRects().length === 0) continue;
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (size < 12) out.push(`${size}px "${node.textContent.trim().slice(0, 30)}"`);
        }
        return out;
      });
      expect(tooSmall).toEqual([]);
    });
  }

  test('Every interactive element is at least 44px tall on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button, summary')]
        .filter((el) => !el.closest('dialog:not([open]), [hidden]'))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height > 0 && r.height < 44)
        .map(({ el, r }) => `${(el.textContent || '').trim().slice(0, 24) || el.id}: ${Math.round(r.height)}px`)
    );
    expect(small).toEqual([]);
  });

  for (const vp of VIEWPORTS) {
    test(`Lightbox shows image, title, caption and unobstructed controls at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const trigger = page.locator('[data-gallery-trigger]').nth(1);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await expect(page.locator('#lightbox-dialog')).toHaveAttribute('open', '');
      await page.waitForFunction(() => {
        const img = document.getElementById('lightbox-img') as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      });
      await page.waitForTimeout(350);

      await expect(page.locator('#lightbox-title')).toHaveText('Profiles');
      await expect(page.locator('#lightbox-caption')).toBeVisible();
      await expect(page.locator('#lightbox-caption')).toContainText('scan history');
      await expect(page.locator('#lightbox-counter')).toHaveText('2 / 9');

      const geo = await page.evaluate(() => {
        const img = document.getElementById('lightbox-img')!.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = window.innerHeight;
        const buttons = [...document.querySelectorAll('#lightbox-dialog button')]
          .map((b) => ({ id: b.id, r: b.getBoundingClientRect() }))
          .filter((b) => b.r.width > 0);
        const covering = buttons.filter((b) =>
          b.r.left < img.right && img.left < b.r.right && b.r.top < img.bottom && img.top < b.r.bottom
        ).map((b) => b.id);
        const offscreen = buttons.filter((b) => b.r.left < 0 || b.r.right > vw || b.r.top < 0 || b.r.bottom > vh).map((b) => b.id);
        return { imgW: img.width, imgBottom: img.bottom, imgTop: img.top, vw, vh, covering, offscreen, navButtons: buttons.length };
      });

      expect(geo.covering).toEqual([]);
      expect(geo.offscreen).toEqual([]);
      expect(geo.navButtons).toBe(3);
      expect(geo.imgTop).toBeGreaterThanOrEqual(0);
      expect(geo.imgBottom).toBeLessThanOrEqual(geo.vh);
      if (vp.width <= 480) {
        expect(geo.imgW).toBeGreaterThanOrEqual(geo.vw * 0.85);
      }

      // The on-screen next button (desktop or mobile variant) advances the gallery
      await page.locator('#lightbox-dialog .lightbox-next-btn:visible').click();
      await expect(page.locator('#lightbox-counter')).toHaveText('3 / 9');

      await page.screenshot({ path: path.join(VISUAL_DIR, `lightbox-open-${vp.name}.png`) });
      await page.locator('#lightbox-close').click();
      await expect(page.locator('#lightbox-dialog')).not.toHaveAttribute('open', '');
      await expect(trigger).toBeFocused();
    });
  }

  test('Command blocks never break inside a token and the hash wraps in whole groups on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await page.locator('#faq summary').nth(5).click();

    const blocks = await page.evaluate(() =>
      [...document.querySelectorAll('.cmd-code, .faq-code')].map((el) => ({
        ws: getComputedStyle(el).whiteSpace,
        lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
        scrollerOverflow: getComputedStyle(el.parentElement!).overflowX,
      }))
    );
    expect(blocks.length).toBe(2);
    for (const b of blocks) {
      expect(b.ws).toBe('pre');
      expect(b.lines).toBe(1);
      expect(b.scrollerOverflow).toBe('auto');
    }

    const hash = await page.evaluate(() => {
      const el = document.getElementById('sha256-hash-val')!;
      const chunks = [...el.querySelectorAll('.hash-chunk')];
      return {
        text: el.textContent,
        chunkCount: chunks.length,
        brokenChunks: chunks.filter((c) => c.getClientRects().length !== 1).length,
        rows: new Set(chunks.map((c) => Math.round(c.getBoundingClientRect().top))).size,
      };
    });
    expect(hash.text).toBe(releaseConfig.sha256);
    expect(hash.chunkCount).toBe(8);
    expect(hash.brokenChunks).toBe(0);
    expect(hash.rows).toBeGreaterThan(1);

    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow).toBeLessThanOrEqual(0);
  });

  test('Screenshot gallery is a hole-free bento grid on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const grid = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.screenshots-bento-grid > *')].map((c) => c.getBoundingClientRect());
      const box = document.querySelector('.screenshots-bento-grid')!.getBoundingClientRect();
      const area = cards.reduce((s, r) => s + r.width * r.height, 0);
      const gap = 24;
      return { count: cards.length, featureW: cards[0].width, otherW: cards[1].width, fill: area / (box.width * box.height), gap };
    });
    expect(grid.count).toBe(9);
    expect(grid.featureW).toBeGreaterThan(grid.otherW * 1.9);
    // 12 cells minus gutters: anything well below ~0.9 means an empty cell
    expect(grid.fill).toBeGreaterThan(0.9);
  });
});