// MMIS Client Interactions - Strict CSP Compliant (CSSOM & textContent only)

// 1. Mark JS enabled on document root for progressive enhancement
document.documentElement.classList.add('js');

// 2. Sticky Navbar scroll elevation & Scroll Progress Indicator (V11: transform scaleX)
const header = document.getElementById('header');
const scrollProgressBar = document.getElementById('scroll-progress');

function handleScroll(): void {
  const scrollY = window.scrollY;

  if (header) {
    if (scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  if (scrollProgressBar) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
    scrollProgressBar.style.setProperty('transform', `scaleX(${ratio})`);
  }
}

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// 3. Active Nav Link Highlighting via IntersectionObserver
const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link, .mobile-nav-link');
const trackedSections = document.querySelectorAll<HTMLElement>('section[id], footer[id]');

if ('IntersectionObserver' in window && trackedSections.length > 0) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) {
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              if (href === `#${id}`) {
                link.classList.add('active');
              } else if (href && href.startsWith('#')) {
                link.classList.remove('active');
              }
            });
          }
        }
      });
    },
    {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    }
  );

  trackedSections.forEach((section) => navObserver.observe(section));
}

// 4. Mobile Navigation Menu Toggle (V1: lock body scroll, swap icon, manage focus)
const mobileMenuBtn = document.getElementById('mobile-menu-toggle') as HTMLButtonElement | null;
const mobileNav = document.getElementById('mobile-nav') as HTMLElement | null;

if (mobileMenuBtn && mobileNav) {
  const hamburgerIcon = mobileMenuBtn.querySelector('.menu-icon-hamburger');
  const closeIcon = mobileMenuBtn.querySelector('.menu-icon-close');

  function toggleMobileMenu(open?: boolean): void {
    const isCurrentlyOpen = mobileMenuBtn?.getAttribute('aria-expanded') === 'true';
    const nextState = typeof open === 'boolean' ? open : !isCurrentlyOpen;

    if (nextState) {
      mobileNav?.removeAttribute('hidden');
      mobileNav?.classList.add('open');
      mobileMenuBtn?.setAttribute('aria-expanded', 'true');
      hamburgerIcon?.setAttribute('hidden', '');
      closeIcon?.removeAttribute('hidden');
      document.body.style.setProperty('overflow', 'hidden');

      // Focus first link in mobile menu
      const firstLink = mobileNav?.querySelector<HTMLAnchorElement>('a');
      firstLink?.focus();
    } else {
      mobileNav?.classList.remove('open');
      mobileNav?.setAttribute('hidden', '');
      mobileMenuBtn?.setAttribute('aria-expanded', 'false');
      hamburgerIcon?.removeAttribute('hidden');
      closeIcon?.setAttribute('hidden', '');
      document.body.style.removeProperty('overflow');

      mobileMenuBtn?.focus();
    }
  }

  mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());

  // Close mobile nav when clicking any link
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleMobileMenu(false));
  });

  // Close mobile menu on Escape
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileMenuBtn.getAttribute('aria-expanded') === 'true') {
      toggleMobileMenu(false);
    }
  });
}

// 5. Section Reveal Animations
const revealElements = document.querySelectorAll<HTMLElement>('.reveal');

if ('IntersectionObserver' in window && revealElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add('revealed'));
}

// 6. Pointer-Following Glow on Feature Cards
const glowCards = document.querySelectorAll<HTMLElement>('[data-glow-card]');

glowCards.forEach((card) => {
  card.addEventListener('pointermove', (e: PointerEvent) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// 7. Hero Screenshot Window Tabs
const heroTabs = document.querySelectorAll<HTMLButtonElement>('[data-hero-tab]');
const heroPanels = document.querySelectorAll<HTMLElement>('.hero-tab-panel');

heroTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const targetKey = tab.getAttribute('data-hero-tab');
    if (!targetKey) return;

    heroTabs.forEach((t) => {
      const isMatch = t === tab;
      t.classList.toggle('active', isMatch);
      t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    heroPanels.forEach((panel) => {
      const isTarget = panel.getAttribute('id') === `hero-view-${targetKey}`;
      panel.classList.toggle('active', isTarget);
      if (isTarget) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  });
});

// 8. Screenshot Lightbox Dialog (V3: title, caption, counter, responsive nav)
interface GalleryItem {
  src: string;
  title: string;
  caption: string;
  trigger: HTMLButtonElement;
}

const lightboxDialog = document.getElementById('lightbox-dialog') as HTMLDialogElement | null;
const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement | null;
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxCloseBtn = document.getElementById('lightbox-close');

const prevButtons = document.querySelectorAll<HTMLButtonElement>('#lightbox-prev-desktop, #lightbox-prev-mobile');
const nextButtons = document.querySelectorAll<HTMLButtonElement>('#lightbox-next-desktop, #lightbox-next-mobile');

const galleryTriggers = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[data-gallery-trigger]')
);

let activeGalleryIndex = 0;
let lastFocusedTrigger: HTMLButtonElement | null = null;

const galleryItems: GalleryItem[] = galleryTriggers.map((trigger) => {
  return {
    src: trigger.getAttribute('data-img-src') || '',
    title: trigger.getAttribute('data-title') || '',
    caption: trigger.getAttribute('data-caption') || '',
    trigger,
  };
});

function updateLightboxView(index: number): void {
  if (index < 0 || index >= galleryItems.length) return;
  activeGalleryIndex = index;
  const item = galleryItems[index];

  if (lightboxImg && item.src) {
    lightboxImg.src = item.src;
    lightboxImg.alt = `${item.title} - ${item.caption}`;
  }

  if (lightboxTitle) {
    lightboxTitle.textContent = item.title;
  }

  if (lightboxCaption) {
    lightboxCaption.textContent = item.caption;
  }

  if (lightboxCounter) {
    lightboxCounter.textContent = `${index + 1} / ${galleryItems.length}`;
  }
}

function openLightbox(index: number, trigger: HTMLButtonElement): void {
  if (!lightboxDialog) return;
  lastFocusedTrigger = trigger;
  updateLightboxView(index);

  if (typeof lightboxDialog.showModal === 'function') {
    lightboxDialog.showModal();
  } else {
    lightboxDialog.setAttribute('open', '');
  }
}

function closeLightbox(): void {
  if (!lightboxDialog) return;
  if (typeof lightboxDialog.close === 'function') {
    lightboxDialog.close();
  } else {
    lightboxDialog.removeAttribute('open');
  }
  if (lastFocusedTrigger) {
    lastFocusedTrigger.focus();
    lastFocusedTrigger = null;
  }
}

galleryTriggers.forEach((trigger, idx) => {
  trigger.addEventListener('click', () => {
    openLightbox(idx, trigger);
  });
});

lightboxCloseBtn?.addEventListener('click', () => {
  closeLightbox();
});

prevButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const nextIdx = (activeGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightboxView(nextIdx);
  });
});

nextButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const nextIdx = (activeGalleryIndex + 1) % galleryItems.length;
    updateLightboxView(nextIdx);
  });
});

// Close when clicking dialog backdrop
lightboxDialog?.addEventListener('click', (e: MouseEvent) => {
  if (e.target === lightboxDialog) {
    closeLightbox();
  }
});

// Lightbox keyboard navigation
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!lightboxDialog?.open) return;

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    const nextIdx = (activeGalleryIndex + 1) % galleryItems.length;
    updateLightboxView(nextIdx);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const nextIdx = (activeGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightboxView(nextIdx);
  }
});

lightboxDialog?.addEventListener('close', () => {
  if (lastFocusedTrigger) {
    lastFocusedTrigger.focus();
    lastFocusedTrigger = null;
  }
});

// 9. Copy SHA-256 Hash with Clipboard API & Fallback (T4: check execCommand boolean)
const copyHashBtn = document.getElementById('copy-hash-btn') as HTMLButtonElement | null;
const copyStatusEl = document.getElementById('copy-status');
const copyErrorEl = document.getElementById('copy-error');

if (copyHashBtn) {
  let revertTimeout: number | undefined;

  copyHashBtn.addEventListener('click', async () => {
    const hash = copyHashBtn.getAttribute('data-hash') || '';
    if (!hash) return;

    const idleSpan = copyHashBtn.querySelector<HTMLElement>('.copy-idle-state');
    const successSpan = copyHashBtn.querySelector<HTMLElement>('.copy-success-state');

    try {
      let copySuccess = false;

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(hash);
        copySuccess = true;
      } else {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = hash;
        tempTextarea.style.setProperty('position', 'fixed');
        tempTextarea.style.setProperty('opacity', '0');
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        copySuccess = document.execCommand('copy');
        document.body.removeChild(tempTextarea);
      }

      if (!copySuccess) {
        throw new Error('Clipboard write command failed');
      }

      copyErrorEl?.setAttribute('hidden', '');
      if (idleSpan && successSpan) {
        idleSpan.setAttribute('hidden', '');
        successSpan.removeAttribute('hidden');
      }

      if (copyStatusEl) {
        copyStatusEl.textContent = 'SHA-256 fingerprint copied to clipboard';
      }

      if (revertTimeout) {
        window.clearTimeout(revertTimeout);
      }

      revertTimeout = window.setTimeout(() => {
        if (idleSpan && successSpan) {
          idleSpan.removeAttribute('hidden');
          successSpan.setAttribute('hidden', '');
        }
        if (copyStatusEl) {
          copyStatusEl.textContent = '';
        }
      }, 2000);
    } catch {
      if (copyStatusEl) {
        copyStatusEl.textContent = 'Failed to copy hash. Please select and copy manually.';
      }
      copyErrorEl?.removeAttribute('hidden');
    }
  });
}

// 10. How It Works - Stepper Progress on Scroll
const stepperFill = document.getElementById('stepper-fill');
const stepCards = document.querySelectorAll<HTMLElement>('.step-card');

if (stepperFill && stepCards.length > 0) {
  function updateStepperProgress(): void {
    if (!stepperFill) return;
    const firstStep = stepCards[0];
    const lastStep = stepCards[stepCards.length - 1];
    if (!firstStep || !lastStep) return;

    const firstRect = firstStep.getBoundingClientRect();
    const lastRect = lastStep.getBoundingClientRect();
    const windowH = window.innerHeight;

    const totalDist = lastRect.top - firstRect.top;
    const progressDist = windowH * 0.6 - firstRect.top;

    if (totalDist > 0) {
      const ratio = Math.min(1, Math.max(0, progressDist / totalDist));
      stepperFill.style.setProperty('transform', `scaleY(${ratio})`);
    }
  }

  window.addEventListener('scroll', updateStepperProgress, { passive: true });
  updateStepperProgress();
}
